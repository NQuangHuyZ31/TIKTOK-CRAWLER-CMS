<?php

namespace Modules\User\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use InvalidArgumentException;
use Modules\Auth\Jobs\PasswordResetNotification;
use Modules\Permission\Repositories\PermissionRepositoryInterface;
use Modules\Role\Repositories\RoleRepositoryInterface;
use Modules\System\Facades\Audit;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected RoleRepositoryInterface $roleRepository,
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    /**
     * Create a new user with role and permission assignments via injected repositories.
     *
     * @param array<string, mixed> $data
     */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $userData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'avatar' => $data['avatar'] ?? null,
                'status' => $data['status'] ?? 'active',
                'is_admin' => !empty($data['is_admin']),
            ];
            
            $user = $this->userRepository->create($userData);

            // Handle role assignments via injected RoleRepository
            $roles = $data['roles'] ?? (isset($data['role']) ? [$data['role']] : []);
            if (!empty($roles) && is_array($roles)) {
                $roleIds = $this->resolveRoleIds($roles);
                $this->userRepository->syncRoles($user, $roleIds);
            }

            // Handle direct permission assignments via injected PermissionRepository
            if (isset($data['permissions']) && is_array($data['permissions'])) {
                $permissionIds = $this->resolvePermissionIds($data['permissions']);
                $this->userRepository->syncPermissions($user, $permissionIds);
            }

            $created = $user->load(['roles.permissions', 'permissions']);

            return $created;
        });
    }

    /**
     * Update an existing user with role and permission assignments via injected repositories.
     */
    public function updateUser(int|string $id, array $data, User|null $currentUser = null): User
    {
        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        // Business safeguard: prevent removing admin privilege from the only remaining admin
        $this->assertNotDemotingLastAdmin($targetUser, $data);

        return DB::transaction(function () use ($targetUser, $data) {
            $allowed = ['name', 'email', 'phone', 'avatar', 'status', 'is_admin'];
            $updateData = array_intersect_key($data, array_flip($allowed));

            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }
            if (array_key_exists('is_admin', $updateData)) {
                $updateData['is_admin'] = (bool) $updateData['is_admin'];
            }

            if (!empty($updateData)) {
                $this->userRepository->update($targetUser->id, $updateData);
            }

            // Sync roles if provided (User::syncRoles automatically audits ROLE_CHANGE via System Event)
            $roles = $data['roles'] ?? (isset($data['role']) ? [$data['role']] : null);
            if ($roles !== null && is_array($roles)) {
                $roleIds = $this->resolveRoleIds($roles);
                $this->userRepository->syncRoles($targetUser, $roleIds);
            }

            // Sync permissions if provided (User::syncPermissions automatically audits PERMISSION_CHANGE via System Event)
            if (isset($data['permissions']) && is_array($data['permissions'])) {
                $permissionIds = $this->resolvePermissionIds($data['permissions']);
                $this->userRepository->syncPermissions($targetUser, $permissionIds);
            }

            return $targetUser->fresh(['roles.permissions', 'permissions']);
        });
    }

    /**
     * Resolve mixed role identifiers (slugs or IDs) via injected RoleRepository.
     */
    public function resolveRoleIds(array $roles): array
    {
        $ids = [];
        $slugs = [];

        foreach ($roles as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item) && trim($item) !== '') {
                $slugs[] = trim($item);
            }
        }

        if (!empty($slugs)) {
            $resolved = $this->roleRepository->resolveIdsBySlugs($slugs);
            $ids = array_merge($ids, $resolved);
        }

        return array_values(array_unique($ids));
    }

    /**
     * Resolve mixed permission identifiers (slugs or IDs) via injected PermissionRepository.
     */
    public function resolvePermissionIds(array $permissions): array
    {
        $ids = [];
        $slugs = [];

        foreach ($permissions as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item) && trim($item) !== '') {
                $slugs[] = trim($item);
            }
        }

        if (!empty($slugs)) {
            $resolved = $this->permissionRepository->resolveIdsBySlugs($slugs);
            $ids = array_merge($ids, $resolved);
        }

        return array_values(array_unique($ids));
    }

    /**
     * Count total administrators in the system.
     */
    protected function countTotalAdministrators(): int
    {
        return $this->userRepository->query()
            ->where(function ($q) {
                $q->where('is_admin', 1)
                    ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
            })
            ->count();
    }

    /**
     * Delete user with safeguards against self-deletion and last admin deletion.
     */
    public function deleteUser(int|string $id, User|null $currentUser = null): bool
    {
        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        $this->assertNotDeletingSelf($currentUser, $id);
        $this->assertNotDeletingLastAdmin($targetUser);

        return $this->userRepository->delete($id);
    }

    /**
     * Update user account status with domain safeguards.
     */
    public function updateStatus(int|string $id, string $status, User|null $currentUser = null): User
    {
        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        $this->assertNotBlockingSelf($currentUser, $id, $status);
        $this->assertNotDeactivatingLastAdmin($targetUser, $status);

        $updated = $this->userRepository->updateStatus($id, $status);
        if (!$updated) {
            throw new InvalidArgumentException('Failed to update user status.');
        }

        return $updated;
    }

    /**
     * Safeguard: Prevent revoking admin status from the only remaining administrator.
     */
    protected function assertNotDemotingLastAdmin(User $targetUser, array $data): void
    {
        if (!$targetUser->isAdmin()) {
            return;
        }

        $willHaveAdminRole = false;
        if (isset($data['roles'])) {
            foreach ($data['roles'] as $r) {
                if ($r === 'admin' || (is_numeric($r) && (int) $r === 1)) {
                    $willHaveAdminRole = true;
                    break;
                }
            }
        } else {
            $willHaveAdminRole = $targetUser->hasRole('admin');
        }

        $willHaveIsAdmin = array_key_exists('is_admin', $data)
            ? (bool) $data['is_admin']
            : (bool) $targetUser->is_admin;

        if (!$willHaveAdminRole && !$willHaveIsAdmin) {
            if ($this->countTotalAdministrators() <= 1) {
                throw new InvalidArgumentException('Cannot revoke admin privileges from the only remaining administrator.');
            }
        }
    }

    /**
     * Safeguard: Prevent self-deletion.
     */
    protected function assertNotDeletingSelf(User|null $currentUser, int|string $id): void
    {
        if ($currentUser && (int) $currentUser->id === (int) $id) {
            throw new InvalidArgumentException('You cannot delete your own account.');
        }
    }

    /**
     * Safeguard: Prevent deleting the last administrator.
     */
    protected function assertNotDeletingLastAdmin(User $targetUser): void
    {
        if ($targetUser->isAdmin() && $this->countTotalAdministrators() <= 1) {
            throw new InvalidArgumentException('Cannot delete the last remaining administrator.');
        }
    }

    /**
     * Safeguard: Prevent self-blocking.
     */
    protected function assertNotBlockingSelf(User|null $currentUser, int|string $id, string $status): void
    {
        if ($currentUser && (int) $currentUser->id === (int) $id && $status === 'blocked') {
            throw new InvalidArgumentException('You cannot block your own account.');
        }
    }

    /**
     * Safeguard: Prevent deactivating or blocking the last active administrator.
     */
    protected function assertNotDeactivatingLastAdmin(User $targetUser, string $status): void
    {
        if ($targetUser->isAdmin() && $status !== 'active') {
            $activeAdminCount = $this->userRepository->query()
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->where('is_admin', 1)
                        ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
                })
                ->count();

            if ($activeAdminCount <= 1) {
                throw new InvalidArgumentException('Cannot deactivate or block the only active administrator.');
            }
        }
    }

    /**
     * Retrieve aggregated roles and permissions catalog for assignment UI.
     */
    public function getRolesAndPermissionsCatalog(): array
    {
        $roles = $this->roleRepository->allWithPermissions()->map(fn($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'slug' => $r->slug,
            'description' => $r->description,
            'permissions' => $r->permissions->pluck('slug')->all(),
        ]);

        $permissions = $this->permissionRepository->all();
        $groupedPermissions = $permissions->groupBy('module')->map(function ($items, $module) {
            return [
                'module' => $module,
                'items' => $items->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'action' => $p->action,
                    'description' => $p->description,
                ]),
            ];
        })->values();

        return [
            'roles' => $roles,
            'permissions' => $permissions->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'module' => $p->module,
                'action' => $p->action,
                'description' => $p->description,
            ]),
            'grouped_permissions' => $groupedPermissions,
        ];
    }

    /**
     * Send email to user to reset password.
     */
    public function sendMailResetPassword(int|string $id): void
    {
        $user = $this->userRepository->findById($id, []);
        if (!$user) {
            throw new InvalidArgumentException('User account not found.');
        }

        try {
            Audit::track(
                action: 'REQUEST_RESET_PASSWORD',
                target: $user,
                execute: function () use ($user) {
                    $token = Password::createToken($user);
                    $resetUrl = config('app.url') . '/admin/auth/login?reset-password=1&token=' . $token . '&email=' . $user->email;
                    PasswordResetNotification::dispatch($user->email, $resetUrl, $user->name);
                },
                metadata: [
                    'target_email' => $user->email,
                    'trigger_by' => auth()->user()?->email ?? 'admin',
                ]
            );
        } catch (\Throwable $th) {
            throw new InvalidArgumentException('Failed to send reset password email.', previous: $th);
        }
    }
}
