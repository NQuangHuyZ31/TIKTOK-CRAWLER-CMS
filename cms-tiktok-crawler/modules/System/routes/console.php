<?php

use Illuminate\Support\Facades\Schedule;
use Modules\System\Services\SystemSettingService;

/*
|--------------------------------------------------------------------------
| System Module Console Routes & Schedules
|--------------------------------------------------------------------------
|
| Dynamic log pruning worker evaluated every minute against database settings.
|
*/

Schedule::command('system:prune-logs')
    ->everyMinute()
    ->name('system:prune-logs')
    ->withoutOverlapping(120)
    ->when(function () {
        return app(SystemSettingService::class)->shouldRunCleanupNow();
    })
    ->description('Prune expired activity and login logs according to retention settings');
