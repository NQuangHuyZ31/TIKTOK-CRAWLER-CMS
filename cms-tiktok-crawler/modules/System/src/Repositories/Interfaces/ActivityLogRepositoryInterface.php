<?php

namespace Modules\System\Repositories\Interfaces;

use Illuminate\Support\Carbon;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\System\Models\ActivityLog;

/**
 * @extends BaseRepositoryInterface<ActivityLog>
 */
interface ActivityLogRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Retrieve aggregate KPI statistics for activity logs.
     *
     * @return array<string, int>
     */
    public function getStatistics(): array;

    /**
     * Retrieve distinct module names present in activity logs.
     *
     * @return array<string>
     */
    public function getDistinctModules(): array;

    /**
     * Retrieve distinct action names present in activity logs.
     *
     * @return array<string>
     */
    public function getDistinctActions(): array;

    /**
     * Find latest activity log matching event criteria.
     */
    public function findLatestByEvent(string $module, string $action, string|int|null $recordId = null): ?ActivityLog;

    /**
     * Prune activity log records created prior to the cutoff date in safe chunks.
     */
    public function pruneBefore(Carbon $cutoffDate, int $chunkSize, int $sleepMs): int;
}
