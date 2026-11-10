<?php

namespace Modules\Core\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\Response;
use Shuchkin\SimpleXLSXGen;
use Modules\Core\Traits\ApiResponseTrait;
use Modules\Core\Traits\FilterSearchTrait;

/**
 * BaseController providing common CRUD actions, API response formatting,
 * and automated query search/filter/sort handling for all modules.
 */
abstract class BaseController extends Controller
{
    use ApiResponseTrait, FilterSearchTrait;

    /**
     * Actions that may be accessed without the default permission check.
     */
    public array $publicActions = [];

    /**
     * Fully qualified Eloquent model class.
     */
    protected string $modelClass = '';

    /**
     * Fully qualified API Resource class.
     */
    protected ?string $resourceClass = null;

    /**
     * Optional FormRequest class for validating store operations.
     */
    protected ?string $storeRequestClass = null;

    /**
     * Optional FormRequest class for validating update operations.
     */
    protected ?string $updateRequestClass = null;

    /**
     * Relationships to eager load on model queries.
     */
    protected array $withRelations = [];

    /**
     * File name prefix for CSV exports (without timestamp or extension).
     */
    protected string $exportFileName = 'export';

    /**
     * Database column name used for export date range filtering.
     */
    protected string $exportDateField = 'created_at';

    /**
     * Associative array of column names and header labels for export:
     * ['column_name' => 'Header Title']
     */
    protected array $exportColumns = [];

    /**
     * List records with pagination, filtering, searching, and sorting.
     * api: GET /{module}/{controller}
     */
    public function index(Request $request): JsonResponse
    {
        $query = $this->buildIndexQuery($request, $this->getModelQuery());

        if ($request->input('pagination') === 'false' || $request->boolean('all')) {
            return $this->respondSuccess($this->transform($query->get()), 'Records retrieved successfully.');
        }

        $perPage = (int) ($request->input('per_page') ?? $request->input('limit') ?? 10);
        $paginator = $query->paginate(min(max($perPage, 1), 100));

        return $this->respondPaginated($this->transform($paginator), 'Records retrieved successfully.');
    }

    /**
     * Retrieve single record details by ID.
     * api: GET /{module}/{controller}/{id}
     */
    public function show(int|string $id): JsonResponse
    {
        $record = $this->findModelRecord($id);

        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        return $this->respondSuccess($this->transform($record), 'Resource retrieved successfully.');
    }

    /**
     * Create and persist a new record.
     * api: POST /{module}/{controller}
     */
    public function store(Request $request): JsonResponse
    {
        $record = $this->getModelQuery()->create($this->validateStore($request));

        return $this->respondSuccess($this->transform($record), 'Resource created successfully.', 201);
    }

    /**
     * Update an existing record by ID.
     * api: PUT/PATCH /{module}/{controller}/{id}
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $record = $this->findModelRecord($id);

        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        $record->update($this->validateUpdate($request, $id));

        return $this->respondSuccess($this->transform($record->fresh($this->withRelations)), 'Resource updated successfully.');
    }

    /**
     * Delete a record by ID.
     * api: DELETE /{module}/{controller}/{id}
     */
    public function destroy(int|string $id): JsonResponse
    {
        $record = $this->findModelRecord($id);

        if (!$record) {
            return $this->respondError('Resource not found.', 404);
        }

        $record->delete();

        return $this->respondSuccess(null, 'Resource deleted successfully.');
    }

    /**
     * Export filtered model records as an Excel (.xlsx) or CSV download.
     * Supports export_format ('xlsx'|'csv'), export_date_from, export_date_to, and export_limit_type / export_limit.
     */
    public function export(Request $request): Response
    {
        $query = $this->buildIndexQuery($request, $this->getModelQuery());

        // Apply Export Date Range if provided
        $dateFrom = $request->input('export_date_from');
        $dateTo = $request->input('export_date_to');
        $dateField = $this->getExportDateField();

        if ($dateFrom) {
            $query->where($dateField, '>=', strlen($dateFrom) === 10 ? $dateFrom . ' 00:00:00' : $dateFrom);
        }
        if ($dateTo) {
            $query->where($dateField, '<=', strlen($dateTo) === 10 ? $dateTo . ' 23:59:59' : $dateTo);
        }

        // Apply Limit if custom limit is requested
        $limitType = $request->input('export_limit_type', 'all');
        $limit = (int) $request->input('export_limit', 0);

        $columns = $this->getExportColumns();
        $format = strtolower((string) $request->input('export_format', 'xlsx'));

        // 1. Native Excel Workbook (.xlsx) via SimpleXLSXGen (industry standard, full emoji & Unicode support)
        if ($format === 'xlsx') {
            $fileName = $this->getExportFileName() . '_' . date('Y-m-d_His') . '.xlsx';
            $tempDir = storage_path('app/exports');
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            $tempFile = $tempDir . '/' . uniqid('export_', true) . '.xlsx';

            $data = [array_values($columns)];

            if ($limitType === 'custom' && $limit > 0) {
                $records = $query->take($limit)->get();
                foreach ($records as $record) {
                    $data[] = $this->mapExportRow($record, $columns);
                }
            } else {
                $chunkSize = 500;
                $page = 1;
                do {
                    $records = $query->forPage($page, $chunkSize)->get();
                    foreach ($records as $record) {
                        $data[] = $this->mapExportRow($record, $columns);
                    }
                    $page++;
                } while ($records->count() === $chunkSize);
            }

            \Shuchkin\SimpleXLSXGen::fromArray($data)->saveAs($tempFile);

            return response()->streamDownload(function () use ($tempFile) {
                $stream = fopen($tempFile, 'rb');
                if ($stream) {
                    fpassthru($stream);
                    fclose($stream);
                }
                @unlink($tempFile);
            }, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        }

        // 2. CSV format with UTF-8 BOM
        $fileName = $this->getExportFileName() . '_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($query, $columns, $limitType, $limit) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel compatibility
            fwrite($handle, "\xEF\xBB\xBF");

            // CSV Header Row
            fputcsv($handle, array_values($columns));

            if ($limitType === 'custom' && $limit > 0) {
                $records = $query->take($limit)->get();
                foreach ($records as $record) {
                    fputcsv($handle, $this->mapExportRow($record, $columns));
                }
            } else {
                $query->chunk(200, function ($records) use ($handle, $columns) {
                    foreach ($records as $record) {
                        fputcsv($handle, $this->mapExportRow($record, $columns));
                    }
                });
            }

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Get the export file name prefix.
     */
    protected function getExportFileName(): string
    {
        return $this->exportFileName;
    }

    /**
     * Get the export date field name.
     */
    protected function getExportDateField(): string
    {
        return $this->exportDateField;
    }

    /**
     * Get the columns to export as ['attribute' => 'Header Label'].
     */
    protected function getExportColumns(): array
    {
        if (!empty($this->exportColumns)) {
            return $this->exportColumns;
        }

        $model = $this->getModelQuery()->getModel();
        $fields = array_merge(['id'], $model->getFillable(), ['created_at']);
        $columns = [];
        foreach ($fields as $field) {
            $columns[$field] = ucwords(str_replace('_', ' ', $field));
        }

        return $columns;
    }

    /**
     * Map a model instance to a flat CSV row array according to configured export columns.
     */
    protected function mapExportRow(Model $record, array $columns): array
    {
        $row = [];
        foreach (array_keys($columns) as $columnKey) {
            $val = $record->{$columnKey} ?? null;
            if ($val instanceof \DateTimeInterface) {
                $val = $val->format('Y-m-d H:i:s');
            } elseif ($columnKey === 'is_verified' || is_bool($val)) {
                $val = $val ? 'Yes' : 'No';
            } elseif (str_ends_with($columnKey, '_count')) {
                $val = $val ?? 0;
            } elseif (is_array($val) || is_object($val)) {
                $val = json_encode($val, JSON_UNESCAPED_UNICODE);
            }
            $row[] = $val ?? '';
        }
        return $row;
    }

    /**
     * Build the index query using configured relations, search, filters and sorting.
     */
    protected function buildIndexQuery(Request $request, Builder $query): Builder
    {
        if ($this->withRelations !== []) {
            $query->with($this->withRelations);
        }

        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return $query;
    }

    /**
     * Get a fresh Eloquent query builder for the controller's model.
     */
    protected function getModelQuery(): Builder
    {
        if (empty($this->modelClass) || !class_exists($this->modelClass)) {
            throw new \BadMethodCallException(
                sprintf('Model class is not configured on [%s] to perform database queries.', static::class)
            );
        }

        return $this->modelClass::query();
    }

    /**
     * Find a model record by ID with eager-loaded relations.
     */
    protected function findModelRecord(int|string $id): ?Model
    {
        $query = $this->getModelQuery();

        if ($this->withRelations !== []) {
            $query->with($this->withRelations);
        }

        return $query->find($id);
    }

    /**
     * Check if an API Resource class is configured and exists.
     */
    protected function hasResourceClass(): bool
    {
        return $this->resourceClass !== null && $this->resourceClass !== '' && class_exists($this->resourceClass);
    }

    /**
     * Transform models, collections and paginators consistently when a Resource is configured.
     */
    protected function transform(mixed $data): mixed
    {
        if (!$this->hasResourceClass()) {
            return $data;
        }

        if ($data instanceof LengthAwarePaginator) {
            return $data->through(fn($item) => $this->resourceClass::make($item));
        }

        if ($data instanceof Collection) {
            return $this->resourceClass::collection($data);
        }

        if ($data instanceof Model) {
            return $this->resourceClass::make($data);
        }

        return $data;
    }

    /**
     * Validate create data using the FormRequest configured by the child controller.
     */
    protected function validateStore(Request $request): array
    {
        if ($request instanceof \Illuminate\Foundation\Http\FormRequest) {
            return $request->validated();
        }

        if ($this->storeRequestClass && class_exists($this->storeRequestClass)) {
            return app($this->storeRequestClass)->validated();
        }

        return $request->all();
    }

    /**
     * Validate update data using the FormRequest configured by the child controller.
     */
    protected function validateUpdate(Request $request, int|string $id): array
    {
        if ($request instanceof \Illuminate\Foundation\Http\FormRequest) {
            return $request->validated();
        }

        if ($this->updateRequestClass && class_exists($this->updateRequestClass)) {
            return app($this->updateRequestClass)->validated();
        }

        return $request->all();
    }
}
