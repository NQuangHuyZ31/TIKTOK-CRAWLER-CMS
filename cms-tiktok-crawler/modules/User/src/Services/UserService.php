<?php

namespace Modules\User\Services;

use Illuminate\Support\Facades\Password;
use InvalidArgumentException;
use Modules\Auth\Jobs\PasswordResetNotification;
use Modules\Permission\Repositories\PermissionRepositoryInterface;
use Modules\Role\Repositories\RoleRepositoryInterface;
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
     * Create a new user with role and permission assignments.
     */
    public function createUser(array $data): User
    {
        return $this->userRepository->createUserWithRolesAndPermissions($data);
    }

    /**
     * Update an existing user with role and permission assignments.
     */
    public function updateUser(int|string $id, array $data, \App\Models\User|User|null $currentUser = null): User
    {
        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        // Check if removing admin privilege from the only remaining admin
        if ($targetUser->isAdmin()) {
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
                $adminCount = User::where(function ($q) {
                    $q->where('is_admin', 1)
                        ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
                })->count();

                if ($adminCount <= 1) {
                    throw new InvalidArgumentException('Cannot revoke admin privileges from the only remaining administrator.');
                }
            }
        }

        $updated = $this->userRepository->updateUserWithRolesAndPermissions($id, $data);
        if (!$updated) {
            throw new InvalidArgumentException('Failed to update user account.');
        }

        return $updated;
    }

    /**
     * Delete user with safeguards against self-deletion and last admin deletion.
     */
    public function deleteUser(int|string $id, \App\Models\User|User|null $currentUser = null): bool
    {
        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        // Prevent self deletion
        if ($currentUser && (int) $currentUser->id === (int) $id) {
            throw new InvalidArgumentException('You cannot delete your own account.');
        }

        // Prevent deletion of the last administrator
        if ($targetUser->isAdmin()) {
            $adminCount = User::where(function ($q) {
                $q->where('is_admin', 1)
                    ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
            })->count();

            if ($adminCount <= 1) {
                throw new InvalidArgumentException('Cannot delete the last remaining administrator.');
            }
        }

        return $this->userRepository->delete($id);
    }

    /**
     * Update user account status with safeguards.
     */
    public function updateStatus(int|string $id, string $status, \App\Models\User|User|null $currentUser = null): User
    {
        if (!in_array($status, ['active', 'inactive', 'blocked'], true)) {
            throw new InvalidArgumentException('Status must be active, inactive, or blocked.');
        }

        $targetUser = $this->userRepository->findById($id, []);
        if (!$targetUser) {
            throw new InvalidArgumentException('User account not found.');
        }

        // Prevent blocking self
        if ($currentUser && (int) $currentUser->id === (int) $id && $status === 'blocked') {
            throw new InvalidArgumentException('You cannot block your own account.');
        }

        // Prevent deactivating/blocking last admin
        if ($targetUser->isAdmin() && $status !== 'active') {
            $activeAdminCount = User::where('status', 'active')
                ->where(function ($q) {
                    $q->where('is_admin', 1)
                        ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
                })
                ->count();

            if ($activeAdminCount <= 1) {
                throw new InvalidArgumentException('Cannot deactivate or block the only active administrator.');
            }
        }

        $updated = $this->userRepository->updateStatus($id, $status);
        if (!$updated) {
            throw new InvalidArgumentException('Failed to update user status.');
        }

        return $updated;
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
            $token = Password::createToken($user);
            $resetUrl = config('app.url') . '/admin/auth/login?reset-password=1&token=' . $token . '&email=' . $user->email;

            PasswordResetNotification::dispatch($user->email, $resetUrl, $user->name);
        } catch (\Throwable $th) {
            throw new InvalidArgumentException('Failed to send reset password email.');
        }
    }
}
