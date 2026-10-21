<?php

namespace Modules\Core\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Role
 *
 * Represents a user role (e.g. admin, manager, editor, viewer).
 */
class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Permissions assigned to this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    /**
     * Users assigned to this role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id');
    }

    /**
     * Check if this role has a specific permission slug.
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->slug === 'admin') {
            return true;
        }

        return $this->permissions->contains('slug', $permissionSlug);
    }

    /**
     * Check if this role can access a specific module with an action.
     */
    public function canAccessModule(string $module, string $action = 'view'): bool
    {
        if ($this->slug === 'admin') {
            return true;
        }

        if ($action === 'view') {
            return $this->hasPermission("{$module}.view") || $this->hasPermission("{$module}.edit");
        }

        return $this->hasPermission("{$module}.edit");
    }

    /**
     * Give permissions to this role.
     */
    public function givePermissionTo(Permission|string ...$permissions): static
    {
        foreach ($permissions as $permission) {
            $perm = is_string($permission)
                ? Permission::firstOrCreate(['slug' => $permission], ['name' => $permission, 'module' => 'core', 'action' => 'view'])
                : $permission;

            $this->permissions()->syncWithoutDetaching([$perm->id]);
        }

        return $this;
    }

    /**
     * Revoke permissions from this role.
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

        return $this;
    }

    /**
     * Sync permissions for this role.
     */
    public function syncPermissions(array $permissionSlugsOrIds): static
    {
        $ids = [];
        foreach ($permissionSlugsOrIds as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item)) {
                $perm = Permission::where('slug', $item)->first();
                if ($perm) {
                    $ids[] = $perm->id;
                }
            } elseif ($item instanceof Permission) {
                $ids[] = $item->id;
            }
        }

        $this->permissions()->sync($ids);
        return $this;
    }
}
