<?php

namespace Modules\Permission\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\Permission\Models\Permission;

class PermissionRepository extends BaseRepository implements PermissionRepositoryInterface
{
    protected function getModel(): Model
    {
        return new Permission();
    }

    public function findById(int|string $id): ?Permission
    {
        /** @var Permission|null */
        return $this->model->find($id);
    }

    public function findBySlug(string $slug): ?Permission
    {
        /** @var Permission|null */
        return Permission::where('slug', $slug)->first();
    }

    /**
     * Get all permissions grouped by module.
     *
     * @return array<string, array<int, Permission>>
     */
    public function getGroupedByModule(): array
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();
        $grouped = [];

        foreach ($permissions as $permission) {
            $grouped[$permission->module][] = $permission;
        }

        return $grouped;
    }

    public function getByIds(array $ids): Collection
    {
        return Permission::whereIn('id', $ids)->get();
    }

    public function getBySlugs(array $slugs): Collection
    {
        return Permission::whereIn('slug', $slugs)->get();
    }

    public function getDistinctModules(): array
    {
        return Permission::distinct()->pluck('module')->filter()->values()->all();
    }
}
