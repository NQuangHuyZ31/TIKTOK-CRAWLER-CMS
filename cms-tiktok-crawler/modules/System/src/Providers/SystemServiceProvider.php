<?php

namespace Modules\System\Providers;

use Illuminate\Support\Facades\Event;
use Modules\Core\Providers\ModuleServiceProvider;
use Modules\System\Console\Commands\PruneSystemLogsCommand;
use Modules\System\Contracts\AuditableEvent;
use Modules\System\Events\ActivityOccurredEvent;
use Modules\System\Listeners\RecordActivityLogListener;
use Modules\System\Repositories\ActivityLogRepository;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;
use Modules\System\Repositories\Interfaces\LoginLogRepositoryInterface;
use Modules\System\Repositories\Interfaces\SystemSettingRepositoryInterface;
use Modules\System\Repositories\LoginLogRepository;
use Modules\System\Repositories\SystemSettingRepository;
use Modules\System\Services\ActivityLogger;
use Modules\System\Services\ActivityLogService;
use Modules\System\Services\Auditor;
use Modules\System\Services\LoginLogService;
use Modules\System\Services\SystemDiagnosticService;
use Modules\System\Services\SystemSettingService;

class SystemServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'System';

    public function register(): void
    {
        // Bind Repository Interfaces to Concrete Implementations
        $this->app->singleton(ActivityLogRepositoryInterface::class, ActivityLogRepository::class);
        $this->app->singleton(LoginLogRepositoryInterface::class, LoginLogRepository::class);
        $this->app->singleton(SystemSettingRepositoryInterface::class, SystemSettingRepository::class);

        // Domain Services
        $this->app->singleton(ActivityLogService::class);
        $this->app->singleton(LoginLogService::class);
        $this->app->singleton(ActivityLogger::class);
        $this->app->singleton(Auditor::class);
        $this->app->singleton(SystemDiagnosticService::class);
        $this->app->singleton(SystemSettingService::class);
    }

    public function boot(): void
    {
        parent::boot();

        // Register Console Commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                PruneSystemLogsCommand::class,
            ]);
        }

        // Register Asynchronous / Queued Activity Log Listener
        Event::listen(ActivityOccurredEvent::class, RecordActivityLogListener::class);
        Event::listen(AuditableEvent::class, RecordActivityLogListener::class);
    }
}
