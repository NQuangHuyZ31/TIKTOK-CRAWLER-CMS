<?php

namespace Modules\System\Traits;

use Illuminate\Support\Facades\DB;
use Modules\System\Events\ActivityOccurredEvent;

trait LogsActivity
{
    /**
     * Boot the trait to attach Eloquent lifecycle listeners.
     */
    public static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            if (!$model->shouldLogActivity('CREATE')) {
                return;
            }

            $newData = $model->getActivitySnapshotData($model->getAttributes());
            if (empty($newData)) {
                return;
            }

            static::safeDispatchActivity(fn() => ActivityOccurredEvent::dispatch(
                action: 'CREATE',
                module: $model->getActivityModuleName(),
                recordId: $model->getActivityRecordIdentifier(),
                recordType: $model->getActivityRecordTypeName(),
                oldData: null,
                newData: $newData,
                metadata: $model->getActivityMetadata('CREATE')
            ));
        });

        static::updated(function ($model) {
            if (!$model->shouldLogActivity('UPDATE')) {
                return;
            }

            $dirty = $model->getDirty();
            if (empty($dirty)) {
                return;
            }

            $oldData = [];
            $newData = [];

            foreach ($dirty as $key => $newValue) {
                if ($model->isActivityAttributeIgnored($key)) {
                    continue;
                }
                $oldData[$key] = $model->getOriginal($key);
                $newData[$key] = $newValue;
            }

            // Guard against "Double Logging": do not log if only ignored attributes (e.g. updated_at) changed
            if (empty($newData)) {
                return;
            }

            $action = $model->resolveActivityAction('UPDATE');

            static::safeDispatchActivity(fn() => ActivityOccurredEvent::dispatch(
                action: $action,
                module: $model->getActivityModuleName(),
                recordId: $model->getActivityRecordIdentifier(),
                recordType: $model->getActivityRecordTypeName(),
                oldData: $oldData,
                newData: $newData,
                metadata: $model->getActivityMetadata($action)
            ));
        });

        static::deleted(function ($model) {
            if (!$model->shouldLogActivity('DELETE')) {
                return;
            }

            $oldData = $model->getActivitySnapshotData($model->getOriginal());

            static::safeDispatchActivity(fn() => ActivityOccurredEvent::dispatch(
                action: 'DELETE',
                module: $model->getActivityModuleName(),
                recordId: $model->getActivityRecordIdentifier(),
                recordType: $model->getActivityRecordTypeName(),
                oldData: !empty($oldData) ? $oldData : null,
                newData: null,
                metadata: $model->getActivityMetadata('DELETE')
            ));
        });
    }

    /**
     * Dispatch an activity event safely with transaction awareness.
     */
    public static function safeDispatchActivity(\Closure $dispatch): void
    {
        if (DB::transactionLevel() > 0) {
            DB::afterCommit($dispatch);
        } else {
            $dispatch();
        }
    }

    /**
     * Synchronize a Many-to-Many relationship and record an activity log if changed.
     *
     * @param string $relation Name of the relationship method on the model (e.g. 'roles', 'permissions')
     * @param array $ids Array of foreign IDs to sync
     * @param string $identifierColumn Column to pluck for comparing old vs new (e.g. 'slug', 'name', 'id')
     * @param string|null $action Custom action name (default: strtoupper($relation) . '_CHANGE')
     * @param string|null $module Custom module name (default: model's activity module)
     * @return array The result of $relation->sync($ids)
     */
    public function auditSync(string $relation, array $ids, string $identifierColumn = 'slug', ?string $action = null, ?string $module = null): array
    {
        $relationQuery = $this->{$relation}();
        $oldItems = $relationQuery->pluck($identifierColumn)->toArray();
        $filteredIds = array_filter(array_map('intval', $ids));
        $result = $relationQuery->sync($filteredIds);
        $newItems = $relationQuery->pluck($identifierColumn)->toArray();

        if (!$this->wasRecentlyCreated && $oldItems != $newItems) {
            $resolvedAction = $action ?? strtoupper($relation) . '_CHANGE';
            $resolvedModule = $module ?? $this->getActivityModuleName();

            static::safeDispatchActivity(fn() => ActivityOccurredEvent::dispatch(
                action: $resolvedAction,
                module: $resolvedModule,
                recordId: $this->getActivityRecordIdentifier(),
                recordType: $this->getActivityRecordTypeName(),
                oldData: [$relation => $oldItems],
                newData: [$relation => $newItems],
                metadata: [
                    'attached' => $result['attached'] ?? [],
                    'detached' => $result['detached'] ?? [],
                    'updated' => $result['updated'] ?? [],
                ]
            ));
        }

        return $result;
    }

    /**
     * Module name associated with this model's activities.
     */
    public function getActivityModuleName(): string
    {
        if (property_exists($this, 'activityModule') && !empty($this->activityModule)) {
            return $this->activityModule;
        }

        $class = static::class;
        if (preg_match('/Modules\\\\([a-zA-Z0-9_]+)\\\\Models/', $class, $matches)) {
            $mod = strtoupper($matches[1]);
            return match ($mod) {
                'USER' => 'USER_MANAGEMENT',
                'TIKTOKACCOUNT', 'CRAWLER' => 'TIKTOK',
                default => $mod,
            };
        }

        return strtoupper(class_basename($this));
    }

    /**
     * Record type name (e.g. TikTokChannel, User, Role).
     */
    public function getActivityRecordTypeName(): string
    {
        if (property_exists($this, 'activityRecordType') && !empty($this->activityRecordType)) {
            return $this->activityRecordType;
        }

        return class_basename($this);
    }

    /**
     * Unique identifier for this record (e.g. '@channel_username', 'user_id', 'role_id').
     */
    public function getActivityRecordIdentifier(): string
    {
        if (property_exists($this, 'activityIdentifierField') && !empty($this->activityIdentifierField)) {
            $field = $this->activityIdentifierField;
            if (!empty($this->{$field})) {
                $val = (string) $this->{$field};
                if ($field === 'username' && !str_starts_with($val, '@')) {
                    return '@' . $val;
                }
                return $val;
            }
        }

        if (!empty($this->username)) {
            return str_starts_with($this->username, '@') ? $this->username : '@' . $this->username;
        }

        if (!empty($this->slug)) {
            return (string) $this->slug;
        }

        return (string) $this->getKey();
    }

    /**
     * Additional metadata context for the activity.
     */
    public function getActivityMetadata(string $action): ?array
    {
        return null;
    }

    /**
     * Filter sensitive attributes (e.g. passwords, tokens).
     */
    public function isActivityAttributeIgnored(string $attribute): bool
    {
        $ignored = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'updated_at'];
        if (property_exists($this, 'activityIgnoredAttributes') && is_array($this->activityIgnoredAttributes)) {
            $ignored = array_merge($ignored, $this->activityIgnoredAttributes);
        }

        return in_array($attribute, $ignored, true);
    }

    /**
     * Clean snapshot array.
     */
    public function getActivitySnapshotData(array $attributes): array
    {
        $clean = [];
        foreach ($attributes as $key => $value) {
            if (!$this->isActivityAttributeIgnored($key)) {
                $clean[$key] = $value;
            }
        }
        return $clean;
    }

    /**
     * Conditionally toggle activity logging for this instance.
     */
    public function shouldLogActivity(string $action): bool
    {
        return true;
    }

    /**
     * Resolve custom action name (e.g. 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'UPDATE').
     */
    public function resolveActivityAction(string $defaultAction): string
    {
        return $defaultAction;
    }
}
