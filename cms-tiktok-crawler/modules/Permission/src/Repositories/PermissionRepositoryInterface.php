<?php

namespace Modules\Permission\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Permission\Models\Permission;

interface PermissionRepositoryInterface
{
    public function all(array $columns = ['*']): Collection;

    public function findById(int|string $id): ?Permission;

    public function findBySlug(string $slug): ?Permission;

    public function getGroupedByModule(): array;

    public function getByIds(array $ids): Collection;

    public function getBySlugs(array $slugs): Collection;

    public function getDistinctModules(): array;
}
