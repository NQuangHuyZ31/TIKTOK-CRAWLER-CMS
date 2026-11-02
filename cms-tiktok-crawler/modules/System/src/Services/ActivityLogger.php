<?php

namespace Modules\System\Services;

use Modules\System\Events\ActivityOccurredEvent;
use Modules\System\Models\ActivityLog;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;
use Modules\User\Models\User;

class ActivityLogger
{
    /**
     * Dispatch an activity audit event to be processed and persisted.
     * Returns the created ActivityLog instance when running synchronously (e.g. tests / sync queue).
     */
    public static function log(
        string $action,
        string $module,
        string|int|null $recordId = null,
        ?string $recordType = null,
        ?array $oldData = null,
        ?array $newData = null,
        ?array $metadata = null,
        string $status = 'SUCCESS',
        ?string $errorMessage = null,
        ?User $user = null
    ): ?ActivityLog {
        $event = new ActivityOccurredEvent(
            action: $action,
            module: $module,
            recordId: $recordId,
            recordType: $recordType,
            oldData: $oldData,
            newData: $newData,
            metadata: $metadata,
            status: $status,
            errorMessage: $errorMessage,
            user: $user
        );

        event($event);

        return app(ActivityLogRepositoryInterface::class)->findLatestByEvent(
            $event->module,
            $event->action,
            $event->recordId
        );
    }
}
