<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;
use Modules\Core\Models\Permission;
use Modules\Core\Models\Role;

/**
 * Trait HasRolesAndPermissions
 *
 * Implements role-based access control with module View/Edit partitioning.
 */
trait HasRolesAndPermissions
{
    /**
     * Roles assigned to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * Direct permissions assigned to the user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions', 'user_id', 'permission_id');
    }

    /**
     * Retrieve all permissions for this user (both via roles and direct).
     */
    public function allPermissions(): Collection
    {
        $rolePermissions = $this->roles->flatMap(function ($role) {
            return $role->permissions;
        });

        return $rolePermissions->merge($this->permissions)->unique('id');
    }

    /**
     * Check if user has a specific role (or one of several roles).
     */
    public function hasRole(string|array $roles): bool
    {
        if (is_array($roles)) {
            return $this->roles->pluck('slug')->intersect($roles)->isNotEmpty();
        }

        return $this->roles->contains('slug', $roles);
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        // Direct user permission
        if ($this->permissions->contains('slug', $permissionSlug)) {
            return true;
        }

        // Role permissions
        foreach ($this->roles as $role) {
            if ($role->hasPermission($permissionSlug)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can access a specific module with an action ('view' or 'edit').
     * Super admin has full access.
     * Edit permission automatically grants View permission.
     */
    public function canAccessModule(string $module, string $action = 'view'): bool
    {
        if ($this->hasRole('admin')) {
            return true;
        }

        $module = strtolower($module);
        $action = strtolower($action);

        if ($action === 'view') {
            return $this->hasPermission("{$module}.view") || $this->hasPermission("{$module}.edit");
        }

        return $this->hasPermission("{$module}.edit");
    }

    /**
     * Get a mapped matrix of view/edit permissions across key modules.
     * Useful for CMS UI authorization checks (showing/hiding buttons, tabs, actions).
     */
    public function getModulePermissions(array $modules = ['crawler', 'tiktok_account', 'core', 'user']): array
    {
        $matrix = [];
        foreach ($modules as $mod) {
            $matrix[$mod] = [
                'view' => $this->canAccessModule($mod, 'view'),
                'edit' => $this->canAccessModule($mod, 'edit'),
            ];
        }

        return $matrix;
    }

    /**
     * Assign one or more roles to the user.
     */
    public function assignRole(Role|string ...$roles): static
    {
        foreach ($roles as $role) {
            $roleModel = is_string($role)
                ? Role::firstOrCreate(['slug' => $role], ['name' => ucfirst($role)])
                : $role;

            $this->roles()->syncWithoutDetaching([$roleModel->id]);
        }

        $this->load('roles.permissions');
        return $this;
    }

    /**
     * Remove one or more roles from the user.
     */
    public function removeRole(Role|string ...$roles): static
    {
        foreach ($roles as $role) {
            $roleModel = is_string($role)
                ? Role::where('slug', $role)->first()
                : $role;

            if ($roleModel) {
                $this->roles()->detach($roleModel->id);
            }
        }

        $this->load('roles.permissions');
        return $this;
    }

    /**
     * Sync user roles by slug or ID.
     */
    public function syncRoles(array $roleSlugsOrIds): static
    {
        $ids = [];
        foreach ($roleSlugsOrIds as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item)) {
                $role = Role::where('slug', $item)->first();
                if ($role) {
                    $ids[] = $role->id;
                }
            } elseif ($item instanceof Role) {
                $ids[] = $item->id;
            }
        }

        $this->roles()->sync($ids);
        $this->load('roles.permissions');
        return $this;
    }

    /**
     * Grant direct permissions to the user.
     */
    public function givePermissionTo(Permission|string ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $perm = is_string($permission)
                ? Permission::firstOrCreate(['slug' => $permission], ['name' => $permission, 'module' => 'core', 'action' => 'view'])
                : $permission;

            $this->permissions()->syncWithoutDetaching([$perm->id]);
        }

        $this->load('permissions');
        return $this;
    }

    /**
     * Revoke direct permissions from the user.
     */
    public function revokePermissionTo(Permission|string ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $perm = is_string($permission)
                ? Permission::where('slug', $permission)->first()
                : $permission;

            if ($perm) {
                $this->permissions()->detach($perm->id);
            }
        }

        $this->load('permissions');
        return $this;
    }
}
