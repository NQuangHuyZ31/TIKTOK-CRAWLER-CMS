<?php

namespace Modules\Role\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Role\Models\Role;

interface RoleRepositoryInterface
{
    public function all(array $columns = ['*']): Collection;

    public function findById(int|string $id): ?Role;

    public function findOrFail(int|string $id): Role;

    public function findBySlug(string $slug): ?Role;

    public function findWithPermissions(int|string $id): ?Role;

    public function allWithCounts(): Collection;

    public function create(array $attributes): Role;

    public function update(int|string $id, array $attributes): bool|Role;

    public function delete(int|string $id): bool;

    public function syncPermissions(Role $role, array $permissionIds): array;
}
