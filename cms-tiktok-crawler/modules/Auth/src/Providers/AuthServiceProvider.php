<?php

namespace Modules\Auth\Providers;

use Illuminate\Routing\Router;
use Modules\Auth\Repositories\AuthRepository;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\Auth\Services\AuthService;
use Modules\Auth\Services\EmailOtpService;
use Modules\Auth\Services\Google2FAService;
use Modules\Auth\Services\Interfaces\EmailOtpServiceInterface;
use Modules\Auth\Services\Interfaces\TwoFactorServiceInterface;
use Modules\Auth\Services\TwoFactorService;
use Modules\Core\Http\Middleware\CheckModulePermission;
use Modules\Core\Providers\ModuleServiceProvider;

class AuthServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Auth';

    /**
     * Register any module services.
     */
    public function register(): void
    {
        $this->app->bind(AuthRepositoryInterface::class, AuthRepository::class);
        $this->app->bind(TwoFactorServiceInterface::class, TwoFactorService::class);
        $this->app->bind(EmailOtpServiceInterface::class, EmailOtpService::class);
        $this->app->singleton(Google2FAService::class);
        $this->app->singleton(AuthService::class);
    }

    /**
     * Bootstrap any module services.
     */
    public function boot(): void
    {
        parent::boot();
        $this->loadViewsFrom(dirname(__DIR__, 2) . '/resources/views', 'auth');

        /** @var Router $router */
        $router = $this->app->make(Router::class);
        $router->aliasMiddleware('auth.permission', CheckModulePermission::class);
    }
}
