<?php

namespace Modules\Permission\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Role\Models\Role;
use Modules\System\Traits\LogsActivity;

class Permission extends Model
{
    use HasFactory, LogsActivity;

    public string $activityModule = 'PERMISSION';
    public string $activityRecordType = 'Permission';
    public string $activityIdentifierField = 'slug';

    protected $table = 'permissions';

    protected $fillable = [
        'name',
        'slug',
        'module',
        'action',
        'description',
    ];

    /**
     * The roles that belong to the permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions', 'permission_id', 'role_id');
    }
}
