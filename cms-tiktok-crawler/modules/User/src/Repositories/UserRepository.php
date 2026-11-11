<?php

namespace Modules\User\Repositories;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class UserRepository extends BaseRepository implements UserRepositoryInterface
{
    protected function getModel(): Model
    {
        return new User();
    }

    /** Find User By email */
    public function findByEmail(string $email): ?User
    {
        return $this->model->where('email', $email)->first();
    }

    /** Find by User ID */
    public function findById(int|string $id, array $relations = ['roles.permissions', 'permissions']): ?User
    {
        return $this->model->with($relations)->find($id);
    }

    /**
     * Synchronize role IDs for a user entity.
     */
    public function syncRoles(User $user, array $roleIds): array
    {
        return $user->syncRoles($roleIds);
    }

    /**
     * Synchronize permission IDs for a user entity.
     */
    public function syncPermissions(User $user, array $permissionIds): array
    {
        return $user->syncPermissions($permissionIds);
    }

    /**
     * Update user account status (active, inactive, blocked).
     */
    public function updateStatus(int|string $id, string $status): ?User
    {
        $user = $this->findById($id, []);
        if (!$user) {
            return null;
        }

        $user->update(['status' => $status]);
        return $user->load(['roles.permissions', 'permissions']);
    }

    /**
     * Clear / reset two-factor authentication secret for a user.
     */
    public function resetTwoFactorSecret(int|string $userId): bool
    {
        $user = $this->findById($userId);
        if ($user) {
            $user->tokens()->delete();
        }

        return (bool) $this->model->where('id', $userId)->update([
            'google2fa_secret' => null,
            'google2fa_enabled' => false,
        ]);
    }

    /**
     * Retrieve aggregate KPI statistics for user management.
     */
    public function getStatisticsSummary(): array
    {
        return [
            'total_users' => $this->model->count(),
            'active_users' => $this->model->where('status', 'active')->count(),
            'inactive_users' => $this->model->where('status', 'inactive')->count(),
            'blocked_users' => $this->model->where('status', 'blocked')->count(),
            'admin_users' => $this->model->where(function ($q) {
                $q->where('is_admin', 1)
                    ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
            })->count(),
            'manager_users' => $this->model->whereHas('roles', fn($q) => $q->where('slug', 'manager'))->count(),
            'editor_users' => $this->model->whereHas('roles', fn($q) => $q->where('slug', 'editor'))->count(),
            'viewer_users' => $this->model->whereHas('roles', fn($q) => $q->where('slug', 'viewer'))->count(),
        ];
    }
}
