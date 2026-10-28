<?php

namespace Modules\System\Contracts;

/**
 * Interface AuditableEvent
 *
 * Implemented by domain events that should automatically be audited
 * into the activity_logs table via the asynchronous RecordActivityLogListener.
 */
interface AuditableEvent
{
    /**
     * Convert domain event payload into standard activity log attributes.
     *
     * Expected array keys:
     * - action (string, required)
     * - module (string, optional - auto-resolved if omitted)
     * - record_id (string, optional)
     * - record_type (string, optional)
     * - old_data (array, optional)
     * - new_data (array, optional)
     * - metadata (array, optional)
     * - status (string, default 'SUCCESS')
     * - error_message (string, optional)
     * - user (User|Authenticatable, optional - auto-resolved to auth()->user() if omitted)
     *
     * @return array<string, mixed>
     */
    public function toActivityLog(): array;
}
