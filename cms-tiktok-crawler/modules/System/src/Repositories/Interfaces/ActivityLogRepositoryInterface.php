<?php

namespace Modules\System\Repositories\Interfaces;

use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface ActivityLogRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Retrieve aggregate KPI statistics for activity logs.
     *
     * @return array<string, int>
     */
    public function getStatistics(): array;

    /**
     * Find latest activity log matching event criteria.
     */
    public function findLatestByEvent(string $module, string $action, string|int|null $recordId = null): ?\Modules\System\Models\ActivityLog;
}
