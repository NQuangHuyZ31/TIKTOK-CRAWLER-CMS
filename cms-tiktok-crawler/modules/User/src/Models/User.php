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
use Illuminate\Support\Facades\DB;
use Modules\Core\Traits\HasRolesAndPermissions;
use Modules\System\Events\ActivityOccurredEvent;
use Modules\System\Traits\LogsActivity;

#[Fillable(['name', 'email', 'password', 'phone', 'avatar', 'status', 'is_admin'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRolesAndPermissions, LogsActivity;

    public string $activityModule = 'USER_MANAGEMENT';
    public string $activityRecordType = 'User';

    protected $table = 'users';

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
        $oldRoles = $this->roles()->pluck('name')->toArray();
        $ids = array_filter(array_map('intval', $roleIds));
        $result = $this->roles()->sync($ids);
        $newRoles = $this->roles()->pluck('name')->toArray();

        if (!$this->wasRecentlyCreated && $oldRoles != $newRoles) {
            $dispatch = fn() => ActivityOccurredEvent::dispatch(
                action: 'ROLE_CHANGE',
                module: 'USER_MANAGEMENT',
                recordId: (string) $this->id,
                recordType: 'User',
                oldData: ['roles' => $oldRoles],
                newData: ['roles' => $newRoles],
            );

            if (DB::transactionLevel() > 0) {
                DB::afterCommit($dispatch);
            } else {
                $dispatch();
            }
        }

        return $result;
    }

    /**
     * Synchronize direct permissions by integer IDs on the relation and audit permission changes.
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
                module: 'USER_MANAGEMENT',
                recordId: (string) $this->id,
                recordType: 'User',
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
