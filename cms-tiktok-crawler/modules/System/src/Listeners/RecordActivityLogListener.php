<?php

namespace Modules\System\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Modules\System\Contracts\AuditableEvent;
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
    public function handle(object $event): ?ActivityLog
    {
        try {
            if ($event instanceof AuditableEvent) {
                return $this->handleAuditableEvent($event);
            }

            if ($event instanceof ActivityOccurredEvent) {
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
            }

            return null;
        } catch (\Throwable $e) {
            $action = property_exists($event, 'action') ? $event->action : 'UNKNOWN';
            $module = property_exists($event, 'module') ? $event->module : 'UNKNOWN';
            $recordId = property_exists($event, 'recordId') ? $event->recordId : null;

            Log::error('Failed to write activity log via event listener: ' . $e->getMessage(), [
                'action' => $action,
                'module' => $module,
                'record_id' => $recordId,
                'exception' => $e,
            ]);
            return null;
        }
    }

    /**
     * Transform and persist an AuditableEvent contract.
     */
    protected function handleAuditableEvent(AuditableEvent $event): ?ActivityLog
    {
        $data = $event->toActivityLog();
        $user = $data['user'] ?? auth()->user();

        $userId = $user?->id ?? null;
        $userEmail = $user?->email ?? null;
        $userRole = null;

        if ($user) {
            if (method_exists($user, 'roles')) {
                $userRole = $user->roles()->pluck('name')->first();
            } elseif (isset($user->role)) {
                $userRole = (string) $user->role;
            }
        }

        return $this->activityLogRepository->create([
            'user_id' => $userId,
            'user_email' => $userEmail,
            'user_role' => $userRole,
            'action' => $data['action'] ?? 'UNKNOWN',
            'module' => $data['module'] ?? 'SYSTEM',
            'record_id' => $data['record_id'] ?? null,
            'record_type' => $data['record_type'] ?? null,
            'old_data' => $data['old_data'] ?? null,
            'new_data' => $data['new_data'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'status' => $data['status'] ?? 'SUCCESS',
            'error_message' => $data['error_message'] ?? null,
            'created_at' => now(),
        ]);
    }
}
