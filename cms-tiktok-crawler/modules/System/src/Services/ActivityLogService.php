<?php

namespace Modules\System\Services;

use Modules\System\Models\ActivityLog;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;
use Modules\User\Models\User;

class ActivityLogService
{
    public function __construct(
        protected ActivityLogRepositoryInterface $activityLogRepository
    ) {}

    /**
     * Record an audit activity log entry by dispatching the ActivityOccurredEvent.
     */
    public function record(
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
        return ActivityLogger::log(
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
    }
}
