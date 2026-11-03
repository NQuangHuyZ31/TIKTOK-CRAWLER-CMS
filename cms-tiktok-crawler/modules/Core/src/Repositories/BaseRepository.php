<?php

namespace Modules\Core\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Core\Traits\FilterSearchTrait;

/**
 * @template TModel of Model
 * @implements BaseRepositoryInterface<TModel>
 */
abstract class BaseRepository implements BaseRepositoryInterface
{
    use FilterSearchTrait;

    protected Model $model;

    /**
     * Resolve the underlying Eloquent model for this repository.
     *
     * @return Model
     */
    abstract protected function getModel(): Model;

    public function __construct()
    {
        $this->model = $this->getModel();
    }

    /**
     * Get a fresh query builder for the repository model.
     *
     * @return Builder
     */
    public function query(): Builder
    {
        return $this->model->newQuery();
    }

    /**
     * Retrieve all records from the database.
     *
     * @param array<int, string> $columns
     * @return Collection
     */
    public function all(array $columns = ['*']): Collection
    {
        return $this->model->all($columns);
    }

    /**
     * Paginate repository model records.
     *
     * @param int $perPage
     * @param array<int, string> $columns
     * @return LengthAwarePaginator
     */
    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->paginate($perPage, $columns);
    }

    /**
     * Find a single record by primary key or return null.
     *
     * @param int|string $id
     * @return Model|null
     */
    public function findById(int|string $id): ?Model
    {
        return $this->model->find($id);
    }

    /**
     * Find a single record by primary key or throw ModelNotFoundException.
     *
     * @param int|string $id
     * @return Model
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(int|string $id): Model
    {
        return $this->model->findOrFail($id);
    }

    /**
     * Create and persist a new model instance.
     *
     * @param array<string, mixed> $attributes
     * @return Model
     */
    public function create(array $attributes): Model
    {
        return $this->model->create($attributes);
    }

    /**
     * Update an existing record by primary key.
     *
     * @param int|string $id
     * @param array<string, mixed> $attributes
     * @return bool|Model
     */
    public function update(int|string $id, array $attributes): bool|Model
    {
        $record = $this->findById($id);
        if (!$record) {
            return false;
        }

        $record->update($attributes);
        return $record;
    }

    /**
     * Update or create a record matching attributes.
     *
     * @param array<string, mixed> $attributes
     * @param array<string, mixed> $values
     * @return Model
     */
    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return $this->model->updateOrCreate($attributes, $values);
    }

    /**
     * Bulk upsert records into the database.
     *
     * @param array<int, array<string, mixed>> $values
     * @param array<int, string>|string $uniqueBy
     * @param array<int, string>|null $update
     * @return int Number of affected rows
     */
    public function upsert(array $values, array|string $uniqueBy, ?array $update = null): int
    {
        return $this->model->upsert($values, $uniqueBy, $update);
    }

    /**
     * Delete a record by primary key.
     *
     * @param int|string $id
     * @return bool
     */
    public function delete(int|string $id): bool
    {
        $record = $this->findById($id);
        if (!$record) {
            return false;
        }

        return (bool) $record->delete();
    }
}
