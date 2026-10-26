<?php

namespace Modules\Role\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\Role\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
    protected function getModel(): Model
    {
        return new Role();
    }

    public function findById(int|string $id): ?Role
    {
        /** @var Role|null */
        return $this->model->find($id);
    }

    public function findOrFail(int|string $id): Role
    {
        /** @var Role */
        return $this->model->findOrFail($id);
    }

    public function findBySlug(string $slug): ?Role
    {
        /** @var Role|null */
        return Role::where('slug', $slug)->first();
    }

    public function findWithPermissions(int|string $id): ?Role
    {
        /** @var Role|null */
        return Role::with('permissions')->find($id);
    }

    public function allWithCounts(): Collection
    {
        return Role::withCount(['permissions', 'users'])->get();
    }

    public function create(array $attributes): Role
    {
        /** @var Role */
        return $this->model->create($attributes);
    }

    public function syncPermissions(Role $role, array $permissionIds): array
    {
        return $role->syncPermissions($permissionIds);
    }
}
