<?php

namespace Modules\Permission\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\Permission\Repositories\PermissionRepository;

class PermissionServiceProvider extends ModuleServiceProvider
{
    protected string $moduleName = 'Permission';

    public function register(): void
    {
        $this->app->bind(PermissionRepositoryInterface::class, PermissionRepository::class);
    }

    public function boot(): void
    {
        parent::boot();
    }
}
