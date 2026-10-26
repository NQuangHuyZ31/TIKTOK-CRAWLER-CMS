<?php

namespace Modules\System\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\System\Repositories\SystemSettingRepository;
use Modules\System\Services\SystemSettingService;

class SystemServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'System';

    public function register(): void
    {
        $this->app->singleton(SystemSettingRepository::class);
        $this->app->singleton(SystemSettingService::class);
    }
}
