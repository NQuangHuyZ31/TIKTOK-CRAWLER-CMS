<?php

namespace Modules\System\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Modules\Core\Repositories\BaseRepository;
use Modules\System\Models\LoginLog;
use Modules\System\Repositories\Interfaces\LoginLogRepositoryInterface;

/**
 * @extends BaseRepository<LoginLog>
 * @implements LoginLogRepositoryInterface
 */
class LoginLogRepository extends BaseRepository implements LoginLogRepositoryInterface
{
    protected function getModel(): Model
    {
        return new LoginLog();
    }

    /**
     * Prune login log records created prior to the cutoff date in safe chunks.
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
