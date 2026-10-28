<?php

namespace Modules\System\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Modules\User\Models\User;

class ActivityOccurredEvent
{
    use Dispatchable, SerializesModels;

    public string $action;
    public string $module;
    public ?string $recordId;
    public ?string $recordType;
    public ?array $oldData;
    public ?array $newData;
    public ?array $metadata;
    public string $status;
    public ?string $errorMessage;
    public ?int $userId;
    public string $userEmail;
    public ?string $userRole;

    /**
     * Create a new activity event and snapshot actor context immediately.
     */
    public function __construct(
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
    ) {
        $this->action = strtoupper($action);
        $this->module = strtoupper($module);
        $this->recordId = $recordId !== null ? (string) $recordId : null;
        $this->recordType = $recordType;
        $this->oldData = $oldData;
        $this->newData = $newData;
        $this->status = strtoupper($status);
        $this->errorMessage = $errorMessage;

        // Snapshot Actor & Request context immediately before queueing
        $user = $user ?? auth('sanctum')->user() ?? auth()->user() ?? (request() ? request()->user() : null);
        $this->userId = $user?->id;
        $this->userEmail = $user?->email ?? 'system';

        $role = null;
        if ($user) {
            if (method_exists($user, 'roles') && $user->roles()->exists()) {
                $role = $user->roles()->first()?->name ?? $user->roles()->first()?->slug;
            } elseif (isset($user->is_admin) && $user->is_admin) {
                $role = 'ADMIN';
            } else {
                $role = 'USER';
            }
        } else {
            $role = 'SYSTEM';
        }
        $this->userRole = $role ? strtoupper($role) : null;

        // Enrich metadata with request info if available
        $enrichedMetadata = $metadata ?? [];
        if (request()) {
            $ip = request()->ip();
            $userAgent = request()->userAgent();

            if (!isset($enrichedMetadata['ip']) && $ip) {
                $enrichedMetadata['ip'] = $ip;
            }
            if (!isset($enrichedMetadata['user_agent']) && $userAgent) {
                $enrichedMetadata['user_agent'] = $userAgent;
            }
        }

        $this->metadata = !empty($enrichedMetadata) ? $enrichedMetadata : null;
    }
}
