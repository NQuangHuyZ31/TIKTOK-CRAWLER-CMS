<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\ActivityLog;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;

/**
 * @extends BaseRepository<ActivityLog>
 * @implements ActivityLogRepositoryInterface
 */
class ActivityLogRepository extends BaseRepository implements ActivityLogRepositoryInterface
{
    protected function getModel(): Model
    {
        return new ActivityLog();
    }

    /**
     * Retrieve aggregate KPI statistics for activity logs.
     *
     * @return array<string, int>
     */
    public function getStatistics(): array
    {
        $total = $this->query()->count();
        $success = $this->query()->where('status', 'SUCCESS')->count();
        $failed = $this->query()->where('status', 'FAILED')->count();
        $today = $this->query()
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return [
            'total_activities' => $total,
            'success_activities' => $success,
            'failed_activities' => $failed,
            'today_activities' => $today,
        ];
    }

    public function findLatestByEvent(string $module, string $action, string|int|null $recordId = null): ?ActivityLog
    {
        $query = $this->query()->where('module', $module)->where('action', $action);
        if ($recordId !== null) {
            $query->where('record_id', (string) $recordId);
        }

        return $query->latest('id')->first();
    }

    /**
     * Prune activity log records created prior to the cutoff date in safe chunks.
     */
    public function pruneBefore(Carbon $cutoffDate, int $chunkSize, int $sleepMs): int
    {
        $totalDeleted = 0;

        do {
            $ids = $this->query()
                ->where('created_at', '<', $cutoffDate)
                ->limit($chunkSize)
                ->pluck('id');

            $count = $ids->count();
            if ($count > 0) {
                $this->query()->whereIn('id', $ids)->delete();
                $totalDeleted += $count;

                if ($sleepMs > 0) {
                    usleep($sleepMs * 1000);
                }
            }
        } while ($count === $chunkSize);

        return $totalDeleted;
    }
}
