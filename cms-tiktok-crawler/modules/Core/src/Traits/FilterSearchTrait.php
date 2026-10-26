<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Trait providing automated search, filtering, relation matching,
 * date boundary evaluation, and sorting capabilities for Eloquent queries.
 */
trait FilterSearchTrait
{
    protected array $searchableColumns = [];
    protected array $filterableColumns = [];
    protected array $sortableColumns = ['id', 'created_at', 'updated_at'];
    protected array $defaultSort = ['id', 'desc'];

    /**
     * Map query parameter aliases to database columns.
     * Example: ['role' => 'roles.slug', 'role_id' => 'roles.id']
     */
    protected array $filterRelationMap = [];

    protected array $reservedFilterKeys = [
        'page',
        'per_page',
        'limit',
        'search',
        'keyword',
        'q',
        'pagination',
        'all',
        '_token',
        'sort_by',
        'order_by',
        'order',
        'direction',
    ];

    /**
     * Apply keyword search across configured searchable columns.
     */
    protected function applySearch(Builder $query, Request $request): Builder
    {
        $search = $this->resolveSearchTerm($request);

        if ($search === '' || $this->searchableColumns === []) {
            return $query;
        }

        return $query->where(function (Builder $searchQuery) use ($search): void {
            foreach ($this->searchableColumns as $index => $column) {
                $this->applySearchColumn($searchQuery, $column, $search, $index === 0);
            }
        });
    }

    /**
     * Resolve the first available search parameter from the request.
     */
    protected function resolveSearchTerm(Request $request): string
    {
        $search = trim((string) (
            $request->input('search') ?? $request->input('keyword') ?? $request->input('q') ?? ''
        ));

        if ($search === 'undefined' || $search === 'null' || $search === 'Invalid Date') {
            return '';
        }

        return $search;
    }

    /**
     * Add a searchable column, including nested relationship columns such as roles.name.
     */
    protected function applySearchColumn(Builder $query, string $column, string $search, bool $isFirst = false): void
    {
        $boolean = $isFirst ? 'where' : 'orWhere';

        if (str_contains($column, '.')) {
            [$relation, $relatedColumn] = $this->splitRelationColumn($column);

            $query->{$boolean === 'where' ? 'whereHas' : 'orWhereHas'}(
                $relation,
                fn(Builder $relationQuery) => $relationQuery->where($relatedColumn, 'like', "%{$search}%")
            );
            return;
        }

        $query->{$boolean}($column, 'like', "%{$search}%");
    }

    /**
     * Iterate over query parameters and apply matching filters.
     */
    protected function applyFilters(Builder $query, Request $request): Builder
    {
        foreach ($request->query() as $key => $value) {
            if ($this->shouldSkipFilter($key, $value)) {
                continue;
            }

            if ($this->applyExactFilterIfAllowed($query, $key, $value)) {
                continue;
            }

            $this->applySuffixFilterIfAllowed($query, $key, $value);
        }

        return $query;
    }

    /**
     * Determine whether a query filter parameter should be skipped.
     */
    protected function shouldSkipFilter(string $key, mixed $value): bool
    {
        return $value === null ||
            $value === '' ||
            $value === 'undefined' ||
            $value === 'null' ||
            $value === 'NaN' ||
            $value === 'Invalid Date' ||
            in_array($key, $this->reservedFilterKeys, true);
    }

    /**
     * Apply a regular filter when its key or mapped column is explicitly allow-listed.
     */
    protected function applyExactFilterIfAllowed(Builder $query, string $key, mixed $value): bool
    {
        $column = $this->filterRelationMap[$key] ?? $key;

        if (!$this->isFilterableColumn($key) && !$this->isFilterableColumn($column)) {
            return false;
        }

        $this->applyFilterItem($query, $column, $value);

        return true;
    }

    /**
     * Parse suffix filters such as started_at_from and price_gte.
     */
    protected function applySuffixFilterIfAllowed(Builder $query, string $key, mixed $value): void
    {
        if (!preg_match('/^(.+)_(from|start|min|gte|to|end|max|lte|gt|lt)$/', $key, $matches)) {
            return;
        }

        $baseKey = $matches[1];
        $column = $this->filterRelationMap[$baseKey] ?? $baseKey;

        if (!$this->isFilterableColumn($baseKey) && !$this->isFilterableColumn($column)) {
            return;
        }

        $this->applyRangeOrComparisonFilter($query, $column, $matches[2], $value);
    }

    /**
     * Apply a single filter item. Routes relationship paths (roles.slug) to whereHas.
     */
    protected function applyFilterItem(Builder $query, string $column, mixed $value): void
    {
        if (str_contains($column, '.')) {
            [$relation, $relatedColumn] = $this->splitRelationColumn($column);

            $query->whereHas($relation, fn(Builder $relationQuery) => $this->applyColumnFilter($relationQuery, $relatedColumn, $value));
            return;
        }

        $this->applyColumnFilter($query, $column, $value);
    }

    /**
     * Apply exact, IN, LIKE, numeric/date range, and boundary date filters on a column.
     */
    protected function applyColumnFilter(Builder $query, string $column, mixed $value): void
    {
        // 1. Numeric between ranges: 1000..5000 or 1000~5000
        if (is_string($value) && preg_match('/^(-?\d+(?:\.\d+)?)\s*(?:\.\.|~)\s*(-?\d+(?:\.\d+)?)$/', $value, $matches)) {
            $query->whereBetween($column, [(float) $matches[1], (float) $matches[2]]);
            return;
        }

        // 2. Date ranges in value: 2026-10-20..2026-10-25 or 2026-10-20~2026-10-25
        if (is_string($value) && preg_match('/^(\d{4}-\d{2}-\d{2})\s*(?:\.\.|~)\s*(\d{4}-\d{2}-\d{2})$/', $value, $dateRange)) {
            $query->whereBetween($column, [
                Carbon::parse($dateRange[1])->startOfDay(),
                Carbon::parse($dateRange[2])->endOfDay(),
            ]);
            return;
        }

        // 3. Date comparison operator in value: >=2026-10-23, <=2026-10-23, >2026-10-23, <2026-10-23
        if (is_string($value) && preg_match('/^(>=|<=|>|<|!=|<>)\s*(\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?)$/', $value, $opMatch)) {
            $operator = $opMatch[1] === '<>' ? '!=' : $opMatch[1];
            $date = Carbon::parse($opMatch[2]);
            $val = in_array($operator, ['<=', '<'], true) ? $date->endOfDay() : $date->startOfDay();
            $query->where($column, $operator, $val);
            return;
        }

        // 4. Numeric comparison operator in value: >=100, <=500, !=10
        if (is_string($value) && preg_match('/^(>=|<=|>|<|!=|<>)\s*(-?\d+(?:\.\d+)?)$/', $value, $matches)) {
            $operator = $matches[1] === '<>' ? '!=' : $matches[1];
            $query->where($column, $operator, (float) $matches[2]);
            return;
        }

        // 5. Date / Datetime string filtering (e.g. '2026-10-23', '2026-10-23 00:00:00', '2026-10-23 15:30:00')
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/', $value)) {
            // 5a. Column indicating start/from bound (e.g. started_at, start_date, from_date, begin_at)
            if (preg_match('/(?:^|_)(?:start(?:ed)?|from|begin|since)(?:_|$)/i', $column)) {
                $query->where($column, '>=', Carbon::parse($value)->startOfDay());
                return;
            }

            // 5b. Column indicating end/finish/to bound (e.g. finished_at, end_date, to_date, until, expired_at)
            if (preg_match('/(?:^|_)(?:finish(?:ed)?|end(?:ed)?|to|until|expir(?:ed|y)?)(?:_|$)/i', $column)) {
                $query->where($column, '<=', Carbon::parse($value)->endOfDay());
                return;
            }

            // 5c. General date column (e.g. created_at, crawled_at, date): match entire day if date-only or 00:00:00
            if (preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]00:00(?::00)?)?$/', $value)) {
                $query->whereDate($column, Carbon::parse($value)->toDateString());
                return;
            }

            $query->where($column, $value);
            return;
        }

        // 6. Multiple values via array
        if (is_array($value)) {
            $query->whereIn($column, $value);
            return;
        }

        // 7. Multiple values via comma-separated string
        if (is_string($value) && str_contains($value, ',') && !str_contains($value, ' ')) {
            $query->whereIn($column, array_map('trim', explode(',', $value)));
            return;
        }

        // 8. Wildcard pattern matching
        if (is_string($value) && str_contains($value, '%')) {
            $query->where($column, 'like', $value);
            return;
        }

        $query->where($column, $value);
    }

    /**
     * Apply a date or numeric range/comparison based on a suffix (e.g. _from, _to, _gte).
     */
    protected function applyRangeOrComparisonFilter(Builder $query, string $column, string $suffix, mixed $value): void
    {
        if (str_contains($column, '.')) {
            [$relation, $relatedColumn] = $this->splitRelationColumn($column);

            $query->whereHas(
                $relation,
                fn(Builder $relationQuery) => $this->applyRangeOrComparisonFilter($relationQuery, $relatedColumn, $suffix, $value)
            );
            return;
        }

        $isNumeric = is_numeric($value);

        try {
            switch ($suffix) {
                case 'from':
                case 'start':
                case 'min':
                case 'gte':
                    $resolvedValue = $isNumeric ? $value + 0 : Carbon::parse($value)->startOfDay();
                    $query->where($column, '>=', $resolvedValue);
                    break;

                case 'to':
                case 'end':
                case 'max':
                case 'lte':
                    $resolvedValue = $isNumeric ? $value + 0 : Carbon::parse($value)->endOfDay();
                    $query->where($column, '<=', $resolvedValue);
                    break;

                case 'gt':
                    $query->where($column, '>', $isNumeric ? $value + 0 : $value);
                    break;

                case 'lt':
                    $query->where($column, '<', $isNumeric ? $value + 0 : $value);
                    break;
            }
        } catch (\Throwable) {
            // Ignore invalid date values rather than failing the request.
        }
    }

    /**
     * Apply allow-listed sorting column and direction.
     */
    protected function applySorting(Builder $query, ?Request $request = null): Builder
    {
        $sortBy = $request?->input('sort_by') ?? $request?->input('order_by');
        $direction = strtolower((string) ($request?->input('order') ?? $request?->input('direction') ?? 'desc'));

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        if (is_string($sortBy) && $sortBy !== '' && preg_match('/^[a-zA-Z0-9_\.]+$/', $sortBy) && in_array($sortBy, $this->sortableColumns, true)) {
            return $query->orderBy($sortBy, $direction);
        }

        if (count($this->defaultSort) >= 2 && is_string($this->defaultSort[0]) && in_array($this->defaultSort[1], ['asc', 'desc'], true)) {
            $query->orderBy($this->defaultSort[0], $this->defaultSort[1]);
        }

        return $query;
    }

    /**
     * Check if a column name is in the allow-listed filterableColumns or mapped aliases.
     */
    protected function isFilterableColumn(string $column): bool
    {
        if ($this->filterableColumns === [] || !preg_match('/^[a-zA-Z0-9_\.]+$/', $column)) {
            return false;
        }

        if (in_array('*', $this->filterableColumns, true) || in_array($column, $this->filterableColumns, true)) {
            return true;
        }

        if (isset($this->filterRelationMap[$column])) {
            $mappedColumn = $this->filterRelationMap[$column];

            if (in_array($mappedColumn, $this->filterableColumns, true)) {
                return true;
            }

            if (str_contains($mappedColumn, '.')) {
                $rootRelation = explode('.', $mappedColumn, 2)[0];

                if (in_array($rootRelation, $this->filterableColumns, true)) {
                    return true;
                }
            }
        }

        if (str_contains($column, '.')) {
            $rootRelation = explode('.', $column, 2)[0];

            if (in_array($rootRelation, $this->filterableColumns, true)) {
                return true;
            }
        }

        $alias = array_search($column, $this->filterRelationMap, true);

        return $alias !== false && in_array($alias, $this->filterableColumns, true);
    }

    /**
     * Split a relationship column path into relation path and final column.
     * Example: 'roles.permissions.slug' -> ['roles.permissions', 'slug']
     */
    private function splitRelationColumn(string $column): array
    {
        $lastDot = strrpos($column, '.');

        return [
            substr($column, 0, $lastDot),
            substr($column, $lastDot + 1),
        ];
    }
}
