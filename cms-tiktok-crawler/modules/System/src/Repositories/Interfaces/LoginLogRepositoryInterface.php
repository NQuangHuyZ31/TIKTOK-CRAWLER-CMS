<?php

namespace Modules\System\Repositories\Interfaces;

use Illuminate\Support\Carbon;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\System\Models\LoginLog;

/**
 * @extends BaseRepositoryInterface<LoginLog>
 */
interface LoginLogRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Prune login log records created prior to the cutoff date in safe chunks.
     */
    public function pruneBefore(Carbon $cutoffDate, int $chunkSize, int $sleepMs): int;
}
