<?php

namespace Modules\Permission\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\Permission\Repositories\PermissionRepository;
use Modules\Permission\Repositories\PermissionRepositoryInterface;
use Modules\Permission\Services\PermissionService;

class PermissionServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Permission';

    public function register(): void
    {
        $this->app->bind(PermissionRepositoryInterface::class, PermissionRepository::class);
        $this->app->singleton(PermissionService::class);
    }
}
