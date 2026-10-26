<?php

namespace Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
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
    protected string $modelClass;

    /**
     * Fully qualified API Resource class.
     */
    protected ?string $resourceClass = null;

    /**
     * Relationships to eager load on model queries.
     */
    protected array $withRelations = [];

    /**
     * List records with pagination, filtering, searching, and sorting.
     * api: GET /{module}/{controller}
     */
    public function index(Request $request): JsonResponse
    {
        $query = $this->buildIndexQuery($request, $this->getModelQuery());
        Log::info('sql', ['query' => $query->toSql()]);

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
        return $request instanceof \Illuminate\Foundation\Http\FormRequest ? $request->validated() : $request->all();
    }

    /**
     * Validate update data using the FormRequest configured by the child controller.
     */
    protected function validateUpdate(Request $request, int|string $id): array
    {
        return $request instanceof \Illuminate\Foundation\Http\FormRequest ? $request->validated() : $request->all();
    }
}
