<?php

namespace Modules\Role\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Role\Models\Role;

interface RoleRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?Role;

    public function findWithPermissions(int|string $id): ?Role;

    public function allWithCounts(): Collection;

    public function allWithPermissions(): Collection;

    public function getBySlugs(array $slugs): Collection;

    public function resolveIdsBySlugs(array $slugs): array;

    public function syncPermissions(Role $role, array $permissionIds): array;
}
