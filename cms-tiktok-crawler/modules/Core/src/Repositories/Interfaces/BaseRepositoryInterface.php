<?php

namespace Modules\Core\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * @template TModel of Model
 */
interface BaseRepositoryInterface
{
    /**
     * Get a fresh query builder for the repository model.
     *
     * @return Builder<TModel>
     */
    public function query(): Builder;

    /**
     * Retrieve all records from the database.
     *
     * @param array<int, string> $columns
     * @return Collection<int, TModel>
     */
    public function all(array $columns = ['*']): Collection;

    /**
     * Paginate repository model records.
     *
     * @param int $perPage
     * @param array<int, string> $columns
     * @return LengthAwarePaginator
     */
    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator;

    /**
     * Find a single record by primary key or return null.
     *
     * @param int|string $id
     * @return TModel|null
     */
    public function findById(int|string $id): ?Model;

    /**
     * Find a single record by primary key or throw ModelNotFoundException.
     *
     * @param int|string $id
     * @return TModel
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(int|string $id): Model;

    /**
     * Create and persist a new model instance.
     *
     * @param array<string, mixed> $attributes
     * @return TModel
     */
    public function create(array $attributes): Model;

    /**
     * Update an existing record by primary key.
     *
     * @param int|string $id
     * @param array<string, mixed> $attributes
     * @return bool|TModel
     */
    public function update(int|string $id, array $attributes): bool|Model;

    /**
     * Update or create a record matching attributes.
     *
     * @param array<string, mixed> $attributes
     * @param array<string, mixed> $values
     * @return TModel
     */
    public function updateOrCreate(array $attributes, array $values = []): Model;

    /**
     * Bulk upsert records into the database.
     *
     * @param array<int, array<string, mixed>> $values
     * @param array<int, string>|string $uniqueBy
     * @param array<int, string>|null $update
     * @return int Number of affected rows
     */
    public function upsert(array $values, array|string $uniqueBy, ?array $update = null): int;

    /**
     * Delete a record by primary key.
     *
     * @param int|string $id
     * @return bool
     */
    public function delete(int|string $id): bool;
}
