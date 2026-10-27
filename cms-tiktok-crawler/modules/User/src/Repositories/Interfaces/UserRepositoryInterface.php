<?php

namespace Modules\User\Repositories\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\User\Models\User;

interface UserRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Find user by email address with roles and permissions eagerly loaded.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Find user by ID with specified relations.
     */
    public function findById(int|string $id, array $relations = ['roles.permissions', 'permissions']): ?User;

    /**
     * Synchronize role IDs for a user entity.
     */
    public function syncRoles(User $user, array $roleIds): array;

    /**
     * Synchronize permission IDs for a user entity.
     */
    public function syncPermissions(User $user, array $permissionIds): array;

    /**
     * Update user account status (active, inactive, blocked).
     */
    public function updateStatus(int|string $id, string $status): ?User;

    /**
     * Retrieve aggregate KPI statistics for user management.
     */
    public function getStatisticsSummary(): array;
}
