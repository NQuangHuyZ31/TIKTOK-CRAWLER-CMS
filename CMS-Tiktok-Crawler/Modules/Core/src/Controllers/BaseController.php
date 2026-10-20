<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Modules\Core\Traits\ApiResponseTrait;

/**
 * Class BaseController
 */
abstract class BaseController extends Controller
{
    use ApiResponseTrait;

    /**
     * protected string $modelClass = CrawlJob::class;
     */
    protected string $modelClass;

    /**
     * protected string $resourceClass = CrawlJobResource::class;
     */
    protected string $resourceClass;

    /**
     * List columns for search.
     */
    protected array $searchableColumns = [];

    /**
     * List columns for filter.
     */
    protected array $filterableColumns = [];

    /**
     * Default sort columns.
     */
    protected array $defaultSort = ['id', 'desc'];

    /**
     * Eager load relationships.
     */
    protected array $withRelations = [];

    /**
     * Ignore query parameters.
     */
    protected array $reservedFilterKeys = [
        'page', 'per_page', 'limit', 'search', 'keyword', 'q',
        'pagination', 'all', '_token',
    ];

    /**
     * RESTful Action: index (GET /{module}/{controller})
     * List records.
     */
    public function index(Request $request)
    {
        $query = $this->buildIndexQuery($request);
        if ($request->input('pagination') === 'false' || $request->boolean('all')) {
            return $this->respondSuccess($this->transform($query->get()), 'Records retrieved successfully.');
        }

        $perPage = (int) ($request->input('per_page') ?? $request->input('limit') ?? 10);
        $paginator = $query->paginate(min(max(1, $perPage), 100));

        if ($this->hasResourceClass()) {
            $paginator->through(fn($item) => $this->resourceClass::make($item));
        }

        return $this->respondPaginated($paginator, 'Records retrieved successfully.');
    }

    /**
     * RESTful Action: show (GET /{module}/{controller}/{id})
     * Get record detail.
     */
    public function show($id)
    {
        $record = $this->findModelRecord($id);
        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        return $this->respondSuccess($this->transform($record), 'Resource retrieved successfully.');
    }

    /**
     * RESTful Action: store (POST /{module}/{controller})
     * Create a new record.
     */
    public function store(Request $request)
    {
        $record = $this->modelClass::create($this->validateStore($request));

        return $this->respondSuccess($this->transform($record), 'Resource created successfully.', 201);
    }

    /**
     * RESTful Action: update (PUT/PATCH /{module}/{controller}/{id})
     * Update a record.
     */
    public function update(Request $request, $id)
    {
        $record = $this->findModelRecord($id);
        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        $record->update($this->validateUpdate($request, $id));

        return $this->respondSuccess($this->transform($record->fresh()), 'Resource updated successfully.');
    }

    /**
     * RESTful Action: destroy (DELETE /{module}/{controller}/{id})
     * Delete a record.
     */
    public function destroy($id)
    {
        $record = $this->findModelRecord($id);
        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        $record->delete();

        return $this->respondSuccess(null, 'Resource deleted successfully.');
    }

    /**
     * Build index query.
     */
    protected function buildIndexQuery(Request $request): Builder
    {
        $query = $this->getModelQuery();

        if (!empty($this->withRelations)) {
            $query->with($this->withRelations);
        }

        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);
        $this->applySorting($query);

        return $query;
    }

    /**
     * Apply search.
     */
    protected function applySearch(Builder $query, Request $request): Builder
    {
        if (empty($this->searchableColumns)) {
            return $query;
        }

        $search = trim((string) ($request->input('search') ?? $request->input('keyword') ?? $request->input('q') ?? ''));
        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            foreach ($this->searchableColumns as $index => $column) {
                if (str_contains($column, '.')) {
                    [$relation, $col] = explode('.', $column, 2);
                    $method = $index === 0 ? 'whereHas' : 'orWhereHas';
                    $q->{$method}($relation, fn(Builder $rq) => $rq->where($col, 'like', "%{$search}%"));
                } else {
                    $method = $index === 0 ? 'where' : 'orWhere';
                    $q->{$method}($column, 'like', "%{$search}%");
                }
            }
        });
    }

    /**
     * Apply filters.
     * Support:
     * - Lower bound of number & date: {column}_from, {column}_start, {column}_min, {column}_gte (>=)
     * - Upper bound of number & date: {column}_to, {column}_end, {column}_max, {column}_lte (<=)
     * - Greater than / less than: {column}_gt (>), {column}_lt (<)
     * - Range of number: 1000..5000 or 1000~5000 (whereBetween)
     * - Comparison operator in value: >=1000, <=5000, >1000, <5000, !=1000
     * - Multiple values: array or comma-separated string (whereIn)
     * - Wildcard (%)
     * - Exact match
     */
    protected function applyFilters(Builder $query, Request $request): Builder
    {
        if (empty($this->filterableColumns)) {
            return $query;
        }

        foreach ($request->query() as $key => $value) {
            if (in_array($key, $this->reservedFilterKeys, true) || $value === null || $value === '') {
                continue;
            }

            // 1. Filter lower bound (>=): column_from / column_start / column_min / column_gte
            if (preg_match('/^(.+)_(from|start|min|gte|at)$/', $key, $m) && $this->isFilterableColumn($m[1])) {
                if (is_numeric($value)) {
                    $query->where($m[1], '>=', $value + 0);
                } else {
                    $query->where($m[1], '>=', Carbon::parse($value)->startOfDay());
                }
                continue;
            }

            // 2. Filter upper bound (<=): column_to / column_end / column_max / column_lte
            if (preg_match('/^(.+)_(to|end|max|lte)$/', $key, $m) && $this->isFilterableColumn($m[1])) {
                if (is_numeric($value)) {
                    $query->where($m[1], '<=', $value + 0);
                } else {
                    $query->where($m[1], '<=', Carbon::parse($value)->endOfDay());
                }
                continue;
            }

            // 3. Filter greater than (>): column_gt
            if (preg_match('/^(.+)_gt$/', $key, $m) && $this->isFilterableColumn($m[1])) {
                $query->where($m[1], '>', is_numeric($value) ? $value + 0 : $value);
                continue;
            }

            // 4. Filter less than (<): column_lt
            if (preg_match('/^(.+)_lt$/', $key, $m) && $this->isFilterableColumn($m[1])) {
                $query->where($m[1], '<', is_numeric($value) ? $value + 0 : $value);
                continue;
            }

            if (!$this->isFilterableColumn($key)) {
                continue;
            }

            // 5. Filter range of number: 1000..5000 or 1000~5000 (whereBetween)
            if (is_string($value) && preg_match('/^(-?\d+(?:\.\d+)?)\s*(?:\.\.|~)\s*(-?\d+(?:\.\d+)?)$/', $value, $range)) {
                $query->whereBetween($key, [$range[1] + 0, $range[2] + 0]);
                continue;
            }

            // 6. Filter comparison operators in value: >=100, <=500, >100, <500, !=100
            if (is_string($value) && preg_match('/^(>=|<=|>|<|!=|<>)\s*(-?\d+(?:\.\d+)?)$/', $value, $opMatch)) {
                $operator = $opMatch[1] === '<>' ? '!=' : $opMatch[1];
                $query->where($key, $operator, $opMatch[2] + 0);
                continue;
            }

            // 7. Filter multiple values: array or comma-separated string (whereIn)
            if (is_array($value)) {
                $query->whereIn($key, $value);
            } elseif (is_string($value) && str_contains($value, ',') && !str_contains($value, ' ')) {
                $query->whereIn($key, array_map('trim', explode(',', $value)));
            } elseif (is_string($value) && str_contains($value, '%')) {
                $query->where($key, 'like', $value);
            } else {
                $query->where($key, $value);
            }
        }

        return $query;
    }

    protected function applySorting(Builder $query): Builder
    {
        if (!empty($this->defaultSort) && count($this->defaultSort) >= 2) {
            $query->orderBy($this->defaultSort[0], $this->defaultSort[1]);
        }

        return $query;
    }

    protected function isFilterableColumn(string $column): bool
    {
        return !empty($this->filterableColumns)
            && preg_match('/^[a-zA-Z0-9_]+$/', $column)
            && (in_array('*', $this->filterableColumns, true) || in_array($column, $this->filterableColumns, true));
    }

    protected function getModelQuery(): Builder
    {
        return $this->modelClass::query();
    }

    protected function findModelRecord(int|string $id): ?Model
    {
        $query = $this->getModelQuery();
        if (!empty($this->withRelations)) {
            $query->with($this->withRelations);
        }

        return $query->find($id);
    }

    /**
     * Check if API Resource transformation is configured and available.
     */
    protected function hasResourceClass(): bool
    {
        return isset($this->resourceClass) && !empty($this->resourceClass);
    }

    /**
     * Transform data using $resourceClass if defined.
     */
    protected function transform(mixed $data): mixed
    {
        if (!$this->hasResourceClass()) {
            return $data;
        }

        return $data instanceof \Illuminate\Support\Collection || $data instanceof \Illuminate\Database\Eloquent\Collection
            ? $this->resourceClass::collection($data)
            : $this->resourceClass::make($data);
    }

    protected function validateStore(Request $request): array
    {
        return $request->all();
    }

    protected function validateUpdate(Request $request, int|string $id): array
    {
        return $request->all();
    }
}
