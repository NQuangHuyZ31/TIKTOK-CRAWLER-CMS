<?php

namespace Modules\Role\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\Role\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\Role\Repositories\RoleRepository;
use Modules\Role\Services\RoleService;

class RoleServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Role';

    public function register(): void
    {
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);

        // Bind RoleService with injected repositories
        $this->app->singleton(RoleService::class, function ($app) {
            return new RoleService(
                $app->make(RoleRepositoryInterface::class),
                $app->make(PermissionRepositoryInterface::class)
            );
        });
    }
}
