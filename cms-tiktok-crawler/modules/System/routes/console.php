<?php

use Illuminate\Support\Facades\Schedule;
use Modules\System\Jobs\PruneExpiredLogsJob;
use Modules\System\Services\SystemSettingService;

/*
|--------------------------------------------------------------------------
| System Module Console Routes & Schedules
|--------------------------------------------------------------------------
|
| Dynamic log pruning worker evaluated every minute against database settings
| and dispatched asynchronously to the Queue Worker to prevent blocking.
|
*/

Schedule::job(new PruneExpiredLogsJob(['trigger' => 'scheduled']))
    ->everyMinute()
    ->name('system:prune-expired-logs')
    ->withoutOverlapping(120)
    ->when(function () {
        return app(SystemSettingService::class)->shouldRunCleanupNow();
    })
    ->description('Prune expired activity and login logs asynchronously via Queue Worker');
