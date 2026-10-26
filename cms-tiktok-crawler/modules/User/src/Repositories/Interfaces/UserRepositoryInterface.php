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
     * Create user record and synchronize roles and direct permissions.
     */
    public function createUserWithRolesAndPermissions(array $data): User;

    /**
     * Update user record and synchronize roles and direct permissions.
     */
    public function updateUserWithRolesAndPermissions(int|string $id, array $data): ?User;

    /**
     * Update user account status (active, inactive, blocked).
     */
    public function updateStatus(int|string $id, string $status): ?User;

    /**
     * Retrieve aggregate KPI statistics for user management.
     */
    public function getStatisticsSummary(): array;

    /**
     * Retrieve list of all available roles and permissions for assignments.
     */
    public function getAllRolesAndPermissions(): array;
}
