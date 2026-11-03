<?php

namespace Modules\Permission\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Permission\Models\Permission;

/**
 * @extends BaseRepositoryInterface<Permission>
 */
interface PermissionRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find a permission by its unique slug identifier.
     */
    public function findBySlug(string $slug): ?Permission;

    /**
     * Retrieve all permissions grouped by module key.
     *
     * @return array<string, array<int, Permission>>
     */
    public function getGroupedByModule(): array;

    /**
     * Retrieve permissions matching an array of primary IDs.
     *
     * @param array<int> $ids
     * @return Collection<int, Permission>
     */
    public function getByIds(array $ids): Collection;

    /**
     * Retrieve permissions matching an array of slugs.
     *
     * @param array<string> $slugs
     * @return Collection<int, Permission>
     */
    public function getBySlugs(array $slugs): Collection;

    /**
     * Resolve unique database IDs for a list of permission slugs.
     *
     * @param array<string> $slugs
     * @return array<int>
     */
    public function resolveIdsBySlugs(array $slugs): array;

    /**
     * Retrieve distinct module names.
     *
     * @return array<string>
     */
    public function getDistinctModules(): array;
}
