<?php

namespace Modules\Core\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Core\Traits\FilterSearchTrait;

abstract class BaseRepository implements BaseRepositoryInterface
{
    use FilterSearchTrait;

    protected Model $model;

    abstract protected function getModel(): Model;

    public function __construct()
    {
        $this->model = $this->getModel();
    }

    public function query(): Builder
    {
        return $this->model->newQuery();
    }

    public function all(array $columns = ['*']): Collection
    {
        return $this->model->all($columns);
    }

    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->paginate($perPage, $columns);
    }

    public function findById(int|string $id): ?Model
    {
        return $this->model->find($id);
    }

    public function findOrFail(int|string $id): Model
    {
        return $this->model->findOrFail($id);
    }

    public function create(array $attributes): Model
    {
        return $this->model->create($attributes);
    }

    public function update(int|string $id, array $attributes): bool|Model
    {
        $record = $this->findById($id);
        if (!$record) return false;
        $record->update($attributes);
        return $record;
    }

    public function delete(int|string $id): bool
    {
        $record = $this->findById($id);
        if (!$record) return false;
        return (bool) $record->delete();
    }
}
