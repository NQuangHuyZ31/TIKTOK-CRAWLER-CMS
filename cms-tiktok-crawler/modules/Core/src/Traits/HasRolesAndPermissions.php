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
     * Get permission mode: 'role' (Role-based) or 'user' (Direct user permissions).
     * These two mechanisms are mutually exclusive and never merged together.
     */
    public function getPermissionType(): string
    {
        if (!empty($this->permission_type)) {
            return $this->permission_type;
        }

        if ($this->permissions->isNotEmpty() && $this->roles->isEmpty()) {
            return 'user';
        }

        return 'role';
    }

    public function isRoleBased(): bool
    {
        return $this->getPermissionType() === 'role';
    }

    public function isUserBased(): bool
    {
        return $this->getPermissionType() === 'user';
    }

    /**
     * Check if user is a Super Administrator (either via is_admin flag or 'admin' role).
     * If is_admin is 1/true, user possesses unrestricted access across all modules.
     */
    public function isAdmin(): bool
    {
        if ((bool) ($this->is_admin ?? false)) {
            return true;
        }

        if ($this->isUserBased()) {
            return false;
        }

        return $this->hasRole('admin');
    }

    /**
     * Check if user has specific role(s) by slug.
     */
    public function hasRole(string|array $roles): bool
    {
        if ($this->isUserBased()) {
            return false;
        }

        $roleList = is_array($roles) ? $roles : [$roles];
        return $this->roles->contains(fn(Role $role) => in_array($role->slug, $roleList, true));
    }

    /**
     * Check if user has a permission slug.
     * Super Administrator ('is_admin' = 1 or 'admin' role) has all permissions by default.
     * Role-based and User-based permission evaluations are mutually exclusive.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        // Direct user permission mode: strictly check direct permissions
        if ($this->isUserBased()) {
            return $this->permissions->contains('slug', $permissionSlug);
        }

        // Role-based permission mode: strictly check assigned roles
        foreach ($this->roles as $role) {
            if ($role->permissions->contains('slug', $permissionSlug)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can access a module action ('view', 'create', 'edit', 'delete').
     * Super Administrator ('is_admin' = 1 or 'admin' role) has full unrestricted access,
     * unless an action is restricted by dev_only_actions when not in dev environment.
     */
    public function canAccessModule(string $module, string $action): bool
    {
        $moduleLower = strtolower($module);
        $actionLower = strtolower($action);

        // Environment check: if not in dev mode, block actions defined in dev_only_actions
        if (!config('modules.enable_dev', false)) {
            $devOnly = config('modules.dev_only_actions', []);
            $blockedActions = array_map('strtolower', array_merge(
                $devOnly['*'] ?? [],
                $devOnly[$moduleLower] ?? []
            ));

            if (in_array($actionLower, $blockedActions, true)) {
                return false;
            }
        }

        if ($this->isAdmin()) {
            return true;
        }

        $ignoreModule = array_map('strtolower', (array) config('modules.ignore_check_permission', []));
        if (in_array($moduleLower, $ignoreModule, true)) {
            return true;
        }

        $slug = $moduleLower . '.' . $actionLower;

        // Direct user permission mode: strictly check direct permissions
        if ($this->isUserBased()) {
            return $this->permissions->contains(fn(Permission $p) =>
                strtolower($p->slug) === $slug || (strtolower($p->module) === $moduleLower && strtolower($p->action) === $actionLower)
            );
        }

        // Role-based permission mode: strictly check assigned roles
        foreach ($this->roles as $role) {
            if ($role->permissions->contains(fn(Permission $p) =>
                strtolower($p->slug) === $slug || (strtolower($p->module) === $moduleLower && strtolower($p->action) === $actionLower)
            )) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get module permissions matrix for the user.
     * When is_admin = 1 or user has 'admin' role, all non-restricted actions return true.
     */
    public function getModulePermissionsMatrix(): array
    {
        $modules = config('modules.modules') ?? [];
        $permissionActions = config('modules.permission_actions') ?? [];
        $ignoreGroup = config('modules.ignore_group') ?? [];
        
        $matrix = [];

        foreach ($modules as $module) {
            if (in_array($module, $ignoreGroup)) {
                continue;
            }

            $matrix[$module] = [];
            foreach ($permissionActions as $action) {
                $matrix[$module][$action['value']] = $this->canAccessModule($module, $action['value']);
            }
        }

        return $matrix;
    }

    /**
     * Get list of all permission slugs the user possesses.
     */
    public function getAllPermissionsSlugs(): array
    {
        $slugs = [];

        if ($this->isAdmin()) {
            $slugs = Permission::pluck('slug')->all();
        } elseif ($this->isUserBased()) {
            $slugs = array_values(array_unique($this->permissions->pluck('slug')->all()));
        } else {
            foreach ($this->roles as $role) {
                $slugs = array_merge($slugs, $role->permissions->pluck('slug')->all());
            }
            $slugs = array_values(array_unique($slugs));
        }

        // Filter out dev-only actions if not in dev mode
        if (!config('modules.enable_dev', false)) {
            $devOnly = config('modules.dev_only_actions', []);
            $globalBlocked = array_map('strtolower', $devOnly['*'] ?? []);

            $slugs = array_values(array_filter($slugs, function ($slug) use ($devOnly, $globalBlocked) {
                $parts = explode('.', strtolower($slug));
                if (count($parts) === 2) {
                    [$mod, $act] = $parts;
                    if (in_array($act, $globalBlocked, true)) {
                        return false;
                    }
                    $modBlocked = array_map('strtolower', $devOnly[$mod] ?? []);
                    if (in_array($act, $modBlocked, true)) {
                        return false;
                    }
                }
                return true;
            }));
        }

        return $slugs;
    }

    /**
     * Get list of role slugs assigned to the user.
     */
    public function getRolesSlugs(): array
    {
        if ($this->isUserBased()) {
            return [];
        }

        return $this->roles->pluck('slug')->all();
    }
}
