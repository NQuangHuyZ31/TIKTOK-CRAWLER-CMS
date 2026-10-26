<?php

namespace Modules\User\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Modules\User\Repositories\UserRepository;
use Modules\User\Services\UserService;

class UserServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'User';

    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->singleton(UserService::class, function ($app) {
            return new UserService($app->make(UserRepositoryInterface::class));
        });
    }
}
