<?php

namespace Modules\Role\Models;

use Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Permission\Models\Permission;
use Modules\System\Traits\LogsActivity;

class Role extends Model
{
    use HasFactory, LogsActivity;

    public string $activityModule = 'ROLE';
    public string $activityRecordType = 'Role';
    public string $activityIdentifierField = 'name';

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
     * Synchronize permissions by IDs directly on the Eloquent relation and audit permission changes.
     */
    public function syncPermissions(array $permissionIds): array
    {
        return $this->auditSync('permissions', $permissionIds, 'slug', action: 'PERMISSION_CHANGE');
    }
}
