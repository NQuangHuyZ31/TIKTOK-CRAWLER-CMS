<?php

namespace Modules\User\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Modules\Core\Traits\HasRolesAndPermissions;
use Modules\System\Traits\LogsActivity;

#[Fillable(['name', 'email', 'password', 'phone', 'avatar', 'status', 'is_admin', 'permission_type'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRolesAndPermissions, LogsActivity;

    public string $activityModule = 'USER_MANAGEMENT';
    public string $activityRecordType = 'User';

    protected $table = 'users';

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'permission_type' => 'string',
        ];
    }

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
     * Synchronize roles by integer IDs on the relation and audit role changes.
     */
    public function syncRoles(array $roleIds): array
    {
        return $this->auditSync('roles', $roleIds, 'name', action: 'ROLE_CHANGE');
    }

    /**
     * Synchronize direct permissions by integer IDs on the relation and audit permission changes.
     */
    public function syncPermissions(array $permissionIds): array
    {
        return $this->auditSync('permissions', $permissionIds, 'slug', action: 'PERMISSION_CHANGE');
    }
}
