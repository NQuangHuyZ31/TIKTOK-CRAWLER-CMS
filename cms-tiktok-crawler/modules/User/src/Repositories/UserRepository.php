<?php

namespace Modules\User\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
     * Create user record and synchronize roles and direct permissions.
     */
    public function createUserWithRolesAndPermissions(array $data): User
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

            /** @var User $user */
            $user = $this->model->create($userData);

            if (isset($data['roles']) && is_array($data['roles'])) {
                $user->syncRoles($data['roles']);
            } elseif (isset($data['role']) && !empty($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            if (isset($data['permissions']) && is_array($data['permissions'])) {
                $user->syncPermissions($data['permissions']);
            }

            return $user->load(['roles.permissions', 'permissions']);
        });
    }

    /**
     * Update user record and synchronize roles and direct permissions.
     *
     * @param array<string, mixed> $data
     */
    public function updateUserWithRolesAndPermissions(int|string $id, array $data): ?User
    {
        $user = $this->findById($id, []);
        if (!$user) {
            return null;
        }

        return DB::transaction(function () use ($user, $data) {
            $updateData = [];

            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
            }
            if (isset($data['email'])) {
                $updateData['email'] = $data['email'];
            }
            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }
            if (array_key_exists('phone', $data)) {
                $updateData['phone'] = $data['phone'];
            }
            if (array_key_exists('avatar', $data)) {
                $updateData['avatar'] = $data['avatar'];
            }
            if (isset($data['status'])) {
                $updateData['status'] = $data['status'];
            }
            if (array_key_exists('is_admin', $data)) {
                $updateData['is_admin'] = (bool) $data['is_admin'];
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            if (isset($data['roles']) && is_array($data['roles'])) {
                $user->syncRoles($data['roles']);
            } elseif (isset($data['role']) && !empty($data['role'])) {
                $user->syncRoles([$data['role']]);
            }

            if (isset($data['permissions']) && is_array($data['permissions'])) {
                $user->syncPermissions($data['permissions']);
            }

            return $user->load(['roles.permissions', 'permissions']);
        });
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
     * Retrieve aggregate KPI statistics for user management.
     *
     * @return array<string, int>
     */
    public function getStatisticsSummary(): array
    {
        return [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'inactive_users' => User::where('status', 'inactive')->count(),
            'blocked_users' => User::where('status', 'blocked')->count(),
            'admin_users' => User::where(function ($q) {
                $q->where('is_admin', 1)
                    ->orWhereHas('roles', fn($r) => $r->where('roles.slug', 'admin'));
            })->count(),
            'manager_users' => User::whereHas('roles', fn($q) => $q->where('slug', 'manager'))->count(),
            'editor_users' => User::whereHas('roles', fn($q) => $q->where('slug', 'editor'))->count(),
            'viewer_users' => User::whereHas('roles', fn($q) => $q->where('slug', 'viewer'))->count(),
        ];
    }
}
