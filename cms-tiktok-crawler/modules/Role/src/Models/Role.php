<?php

namespace Modules\Role\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Permission\Models\Permission;

class Role extends Model
{
    use HasFactory;

    protected $table = 'roles';

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * The permissions that belong to the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id');
    }

    /**
     * The users that belong to the role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles', 'role_id', 'user_id');
    }

    /**
     * Synchronize permissions by slugs or IDs.
     *
     * @param array<int|string> $permissions
     */
    public function syncPermissions(array $permissions): array
    {
        $ids = [];
        $slugs = [];

        foreach ($permissions as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } else {
                $slugs[] = (string) $item;
            }
        }

        if (!empty($slugs)) {
            $resolvedIds = app(\Modules\Permission\Repositories\PermissionRepositoryInterface::class)->resolveIdsBySlugs($slugs);
            $ids = array_unique(array_merge($ids, $resolvedIds));
        }

        return $this->permissions()->sync($ids);
    }
}
