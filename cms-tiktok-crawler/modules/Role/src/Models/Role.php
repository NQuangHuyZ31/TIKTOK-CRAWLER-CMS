<?php

namespace Modules\Role\Models;

use Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;
use Modules\Permission\Models\Permission;
use Modules\System\Events\ActivityOccurredEvent;
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
        $oldPermissions = $this->permissions()->pluck('slug')->toArray();
        $ids = array_filter(array_map('intval', $permissionIds));
        $result = $this->permissions()->sync($ids);
        $newPermissions = $this->permissions()->pluck('slug')->toArray();

        if (!$this->wasRecentlyCreated && $oldPermissions != $newPermissions) {
            $dispatch = fn() => ActivityOccurredEvent::dispatch(
                action: 'PERMISSION_CHANGE',
                module: 'ROLE',
                recordId: (string) $this->id,
                recordType: 'Role',
                oldData: ['permissions' => $oldPermissions],
                newData: ['permissions' => $newPermissions],
            );

            if (DB::transactionLevel() > 0) {
                DB::afterCommit($dispatch);
            } else {
                $dispatch();
            }
        }

        return $result;
    }
}
