<?php

namespace Modules\Core\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

interface BaseRepositoryInterface
{
    public function query(): Builder;
    public function all(array $columns = ['*']): Collection;
    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator;
    public function findById(int|string $id): ?Model;
    public function findOrFail(int|string $id): Model;
    public function create(array $attributes): Model;
    public function update(int|string $id, array $attributes): bool|Model;
    public function delete(int|string $id): bool;
}
