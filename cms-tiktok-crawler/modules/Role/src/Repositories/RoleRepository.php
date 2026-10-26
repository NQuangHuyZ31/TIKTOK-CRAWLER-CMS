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

    public function findBySlug(string $slug): ?Role
    {
        /** @var Role|null */
        return $this->model->where('slug', $slug)->first();
    }

    public function findWithPermissions(int|string $id): ?Role
    {
        /** @var Role|null */
        return $this->model->with('permissions')->find($id);
    }

    public function allWithCounts(): Collection
    {
        return $this->model->withCount(['permissions', 'users'])->get();
    }

    public function allWithPermissions(): Collection
    {
        return $this->model->with('permissions')->get();
    }

    public function getBySlugs(array $slugs): Collection
    {
        return $this->model->whereIn('slug', $slugs)->get();
    }

    public function resolveIdsBySlugs(array $slugs): array
    {
        return $this->model->whereIn('slug', $slugs)->pluck('id')->all();
    }

    public function syncPermissions(Role $role, array $permissionIds): array
    {
        return $role->permissions()->sync($permissionIds);
    }
}
