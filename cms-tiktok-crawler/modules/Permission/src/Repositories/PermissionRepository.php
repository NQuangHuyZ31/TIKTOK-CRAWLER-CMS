<?php

namespace Modules\Permission\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\Permission\Models\Permission;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;

/**
 * @extends BaseRepository<Permission>
 * @implements PermissionRepositoryInterface
 */
class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface
{
    protected function getModel(): Model
    {
        return new Permission();
    }

    public function findBySlug(string $slug): ?Permission
    {
        return $this->model->where('slug', $slug)->first();
    }

    /**
     * Get all permissions grouped by module.
     *
     * @return array<string, array<int, Permission>>
     */
    public function getGroupedByModule(): array
    {
        $permissions = $this->model->orderBy('module')->orderBy('action')->get();
        $grouped = [];

        foreach ($permissions as $permission) {
            $grouped[$permission->module][] = $permission;
        }

        return $grouped;
    }

    public function getByIds(array $ids): Collection
    {
        return $this->model->whereIn('id', $ids)->get();
    }

    public function getBySlugs(array $slugs): Collection
    {
        return $this->model->whereIn('slug', $slugs)->get();
    }

    public function resolveIdsBySlugs(array $slugs): array
    {
        return $this->model->whereIn('slug', $slugs)->pluck('id')->all();
    }

    public function getDistinctModules(): array
    {
        return $this->model->distinct()->pluck('module')->filter()->values()->all();
    }
}
