<?php

namespace Modules\Permission\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Permission\Models\Permission;

interface PermissionRepositoryInterface extends BaseRepositoryInterface
{
    public function findBySlug(string $slug): ?Permission;

    public function getGroupedByModule(): array;

    public function getByIds(array $ids): Collection;

    public function getBySlugs(array $slugs): Collection;

    public function resolveIdsBySlugs(array $slugs): array;

    public function getDistinctModules(): array;
}
