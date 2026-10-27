<?php

namespace Modules\Core\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;

trait HasRolesAndPermissions
{
    /**
     * User roles relation.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * User direct permissions relation.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions', 'user_id', 'permission_id');
    }

    /**
     * Check if user is a Super Administrator (either via is_admin flag or 'admin' role).
     * If is_admin is 1/true, user possesses unrestricted access across all modules.
     */
    public function isAdmin(): bool
    {
        return (bool) ($this->is_admin ?? false) || $this->hasRole('admin');
    }

    /**
     * Check if user has specific role(s) by slug.
     */
    public function hasRole(string|array $roles): bool
    {
        $roleList = is_array($roles) ? $roles : [$roles];
        return $this->roles->contains(fn(Role $role) => in_array($role->slug, $roleList, true));
    }

    /**
     * Check if user has a permission slug.
     * Super Administrator ('is_admin' = 1 or 'admin' role) has all permissions by default.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        // Direct permission
        if ($this->permissions->contains('slug', $permissionSlug)) {
            return true;
        }

        // Permission via assigned roles
        foreach ($this->roles as $role) {
            if ($role->permissions->contains('slug', $permissionSlug)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can access a module action ('view' or 'edit').
     * Super Administrator ('is_admin' = 1 or 'admin' role) has full unrestricted access.
     */
    public function canAccessModule(string $module, string $action): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        $ignoreModule = config('modules.ignore_check_permission', []);
        if (in_array($module, $ignoreModule)) {
            return true;
        }

        $slug = strtolower($module) . '.' . strtolower($action);

        // Check direct permission
        if ($this->permissions->contains(fn(Permission $p) =>
            $p->slug === $slug || ($p->module === $module && $p->action === $action)
        )) {
            return true;
        }

        // Check role permissions
        foreach ($this->roles as $role) {
            if ($role->permissions->contains(fn(Permission $p) =>
                $p->slug === $slug || ($p->module === $module && $p->action === $action)
            )) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get module permissions matrix for the user.
     * When is_admin = 1 or user has 'admin' role, all modules grant full view and edit access.
     */
    public function getModulePermissionsMatrix(): array
    {
        $modules = config('modules.modules') ?? [];
        $permissionActions = config('modules.permission_action') ?? [];
        $ignoreGroup = config('modules.ignore_group') ?? [];
        
        $matrix = [];
        $isSuperAdmin = $this->isAdmin();

        foreach ($modules as $module) {
            if (in_array($module, $ignoreGroup)) {
                continue;
            }

            $matrix[$module] = [];
            foreach ($permissionActions as $action) {
                $matrix[$module][$action] = $isSuperAdmin || $this->canAccessModule($module, $action);
            }
        }

        return $matrix;
    }

    /**
     * Get list of all permission slugs the user possesses.
     */
    public function getAllPermissionsSlugs(): array
    {
        if ($this->isAdmin()) {
            return Permission::pluck('slug')->all();
        }

        $slugs = $this->permissions->pluck('slug')->all();

        foreach ($this->roles as $role) {
            $slugs = array_merge($slugs, $role->permissions->pluck('slug')->all());
        }

        return array_values(array_unique($slugs));
    }

    /**
     * Get list of role slugs assigned to the user.
     */
    public function getRolesSlugs(): array
    {
        return $this->roles->pluck('slug')->all();
    }
}
