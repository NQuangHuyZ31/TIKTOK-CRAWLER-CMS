<?php

namespace Modules\System\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Modules\System\Events\ActivityOccurredEvent;

class Auditor
{
    /**
     * Record an audit activity log entry (transaction-safe event dispatch).
     *
     * @param string $action Business action name (e.g. 'RETRY_CRAWL', 'LOGIN', 'RESET_PASSWORD')
     * @param Model|string|null $target Target Eloquent Model or record ID string
     * @param array $metadata Key-value pairs for context metadata
     * @param string $status 'SUCCESS' or 'FAILED'
     * @param string|null $errorMessage Optional error description
     * @param string|null $module Optional module override (e.g. 'TIKTOK', 'USER_MANAGEMENT')
     * @param string|null $recordId Optional record ID override
     * @param string|null $recordType Optional record type override
     * @param array|null $oldData Optional previous state snapshot
     * @param array|null $newData Optional new state snapshot
     * @param mixed $user Optional actor user instance
     */
    public function record(
        string $action,
        Model|string|null $target = null,
        array $metadata = [],
        string $status = 'SUCCESS',
        ?string $errorMessage = null,
        ?string $module = null,
        ?string $recordId = null,
        ?string $recordType = null,
        ?array $oldData = null,
        ?array $newData = null,
        mixed $user = null
    ): void {
        [$resolvedRecordId, $resolvedRecordType, $resolvedModule] = $this->resolveTargetContext($target, $recordId, $recordType, $module);

        $dispatch = fn() => ActivityOccurredEvent::dispatch(
            action: $action,
            module: $resolvedModule,
            recordId: $resolvedRecordId,
            recordType: $resolvedRecordType,
            oldData: $oldData,
            newData: $newData,
            metadata: $metadata,
            status: $status,
            errorMessage: $errorMessage,
            user: $user
        );

        if (DB::transactionLevel() > 0) {
            DB::afterCommit($dispatch);
        } else {
            $dispatch();
        }
    }

    /**
     * Execute a callback wrapped in an automated audit boundary:
     * - Records SUCCESS if the callback completes without exceptions and returns its result.
     * - Records FAILED with exception message and re-throws the exception if an error occurs.
     *
     * @template T
     * @param string $action
     * @param Model|string|null $target
     * @param callable(): T $execute
     * @param array $metadata
     * @param string|null $module
     * @param string|null $recordId
     * @param string|null $recordType
     * @return T
     * @throws \Throwable
     */
    public function track(
        string $action,
        Model|string|null $target,
        callable $execute,
        array $metadata = [],
        ?string $module = null,
        ?string $recordId = null,
        ?string $recordType = null
    ): mixed {
        try {
            $result = $execute();

            $this->record(
                action: $action,
                target: $target,
                metadata: $metadata,
                status: 'SUCCESS',
                module: $module,
                recordId: $recordId,
                recordType: $recordType
            );

            return $result;
        } catch (\Throwable $th) {
            $this->record(
                action: $action,
                target: $target,
                metadata: $metadata,
                status: 'FAILED',
                errorMessage: $th->getMessage(),
                module: $module,
                recordId: $recordId,
                recordType: $recordType
            );

            throw $th;
        }
    }

    /**
     * Helper to resolve recordId, recordType, and module from a target model or explicit parameters.
     *
     * @return array{0: string|null, 1: string, 2: string}
     */
    public function resolveTargetContext(
        Model|string|null $target,
        ?string $recordId = null,
        ?string $recordType = null,
        ?string $module = null
    ): array {
        if ($target instanceof Model) {
            $resolvedRecordId = $recordId ?? $this->resolveModelIdentifier($target);
            $resolvedRecordType = $recordType ?? (method_exists($target, 'getActivityRecordTypeName') ? $target->getActivityRecordTypeName() : class_basename($target));
            $resolvedModule = $module ?? (method_exists($target, 'getActivityModuleName') ? $target->getActivityModuleName() : $this->inferModuleFromModel($target));

            return [$resolvedRecordId, $resolvedRecordType, $resolvedModule];
        }

        $resolvedRecordId = $recordId ?? ($target !== null ? (string) $target : null);
        $resolvedRecordType = $recordType ?? 'Custom';
        $resolvedModule = $module ?? 'SYSTEM';

        return [$resolvedRecordId, $resolvedRecordType, $resolvedModule];
    }

    protected function resolveModelIdentifier(Model $model): string
    {
        if (method_exists($model, 'getActivityRecordIdentifier')) {
            return $model->getActivityRecordIdentifier();
        }

        if (!empty($model->username)) {
            return str_starts_with($model->username, '@') ? $model->username : '@' . $model->username;
        }

        if (!empty($model->slug)) {
            return (string) $model->slug;
        }

        return (string) $model->getKey();
    }

    protected function inferModuleFromModel(Model $model): string
    {
        $class = get_class($model);
        if (preg_match('/Modules\\\\([a-zA-Z0-9_]+)\\\\Models/', $class, $matches)) {
            $mod = strtoupper($matches[1]);
            return match ($mod) {
                'USER' => 'USER_MANAGEMENT',
                'TIKTOKACCOUNT', 'CRAWLER' => 'TIKTOK',
                default => $mod,
            };
        }

        return strtoupper(class_basename($model));
    }
}
