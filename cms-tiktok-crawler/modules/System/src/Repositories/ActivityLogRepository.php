<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\ActivityLog;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;

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
}
