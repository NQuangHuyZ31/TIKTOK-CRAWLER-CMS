<?php

namespace Modules\User\Models;

use App\Models\User as BaseUser;
use Illuminate\Database\Eloquent\Builder;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;

class User extends BaseUser
{
    protected $table = 'users';

    /**
     * Scope query to search by name, email, or phone.
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    /**
     * Scope query to filter by user status.
     */
    public function scopeFilterStatus(Builder $query, ?string $status): Builder
    {
        if (empty($status)) {
            return $query;
        }

        return $query->where('status', $status);
    }

    /**
     * Scope query to filter by role slug or role ID.
     */
    public function scopeFilterRole(Builder $query, int|string|null $role): Builder
    {
        if (empty($role)) {
            return $query;
        }

        if ($role === 'admin') {
            return $query->where(function (Builder $q) {
                $q->where('is_admin', 1)
                    ->orWhereHas('roles', fn(Builder $r) => $r->where('roles.slug', 'admin'));
            });
        }

        return $query->whereHas('roles', function (Builder $q) use ($role) {
            if (is_numeric($role)) {
                $q->where('roles.id', (int) $role);
            } else {
                $q->where('roles.slug', (string) $role);
            }
        });
    }

    /**
     * Synchronize roles by integer IDs on the relation.
     * Slug resolution is delegated to RoleService / UserService via Dependency Injection.
     */
    public function syncRoles(array $roleIds): array
    {
        $ids = array_filter(array_map('intval', $roleIds));
        return $this->roles()->sync($ids);
    }

    /**
     * Synchronize direct permissions by integer IDs on the relation.
     * Slug resolution is delegated to PermissionService / UserService via Dependency Injection.
     */
    public function syncPermissions(array $permissionIds): array
    {
        $ids = array_filter(array_map('intval', $permissionIds));
        return $this->permissions()->sync($ids);
    }

    /**
     * Check if user is Super Administrator.
     * When is_admin = 1, user possesses full unrestricted access across all modules.
     */
    public function isAdmin(): bool
    {
        return (bool) ($this->is_admin ?? false) || $this->hasRole('admin');
    }
}
