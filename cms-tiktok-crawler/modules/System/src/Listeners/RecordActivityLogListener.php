<?php

namespace Modules\System\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Modules\System\Events\ActivityOccurredEvent;
use Modules\System\Models\ActivityLog;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;

class RecordActivityLogListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected ActivityLogRepositoryInterface $activityLogRepository
    ) {}

    /**
     * Handle the event and persist the activity log record via repository.
     */
    public function handle(ActivityOccurredEvent $event): ?ActivityLog
    {
        try {
            return $this->activityLogRepository->create([
                'user_id' => $event->userId,
                'user_email' => $event->userEmail,
                'user_role' => $event->userRole,
                'action' => $event->action,
                'module' => $event->module,
                'record_id' => $event->recordId,
                'record_type' => $event->recordType,
                'old_data' => $event->oldData,
                'new_data' => $event->newData,
                'metadata' => $event->metadata,
                'status' => $event->status,
                'error_message' => $event->errorMessage,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to write activity log via event listener: ' . $e->getMessage(), [
                'action' => $event->action,
                'module' => $event->module,
                'record_id' => $event->recordId,
                'exception' => $e,
            ]);
            return null;
        }
    }
}
