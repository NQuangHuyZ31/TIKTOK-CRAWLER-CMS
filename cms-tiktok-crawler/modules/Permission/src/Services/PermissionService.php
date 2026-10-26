<?php

namespace Modules\Permission\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Permission\Repositories\PermissionRepositoryInterface;

class PermissionService
{
    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    /**
     * Retrieve all permissions grouped by module.
     */
    public function getGroupedPermissions(): array
    {
        return $this->permissionRepository->getGroupedByModule();
    }

    /**
     * Retrieve all permissions collection.
     */
    public function getAllPermissions(): Collection
    {
        return $this->permissionRepository->all();
    }

    /**
     * Retrieve unique module names.
     */
    public function getModules(): array
    {
        return $this->permissionRepository->getDistinctModules();
    }
}
