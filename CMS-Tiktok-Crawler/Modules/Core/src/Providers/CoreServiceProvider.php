<?php

namespace Modules\Core\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Core\Support\ModuleRegistry;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ModuleRegistry::class, function () {
            return new ModuleRegistry();
        });

        // Auto-register any custom module providers if they exist
        $this->registerModuleProviders();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->mergeConfigFrom(dirname(__DIR__, 2) . '/configs/admin.php', 'admin');
        $this->loadViewsFrom(dirname(__DIR__, 2) . '/resources/views', 'core');
        $this->registerModuleRoutes();
    }

    /**
     * Auto-register module ServiceProviders if they exist.
     */
    protected function registerModuleProviders(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = $this->app->make(ModuleRegistry::class);

        foreach (array_keys($registry->all()) as $name) {
            if ($name === 'Core') {
                continue;
            }

            foreach ($registry->providerClasses($name) as $providerClass) {
                if (class_exists($providerClass)) {
                    $this->app->register($providerClass);
                }
            }
        }
    }

    /**
     * Auto-discover and register all module routes through Core.
     * All routes pass through Core; no routes need to be registered in root routes/api.php.
     */
    protected function registerModuleRoutes(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = $this->app->make(ModuleRegistry::class);
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $adminPrefix = $adminPath !== '' ? $adminPath : 'admin';

        Route::prefix($adminPrefix)->group(function () use ($registry) {
            // 1. Register API routes for all modules under /{admin_path}/api
            Route::prefix('api')->middleware('api')->group(function () use ($registry) {
                foreach ($registry->all() as $name => $moduleDir) {
                    if ($name === 'Core') {
                        continue;
                    }

                    $apiRoutes = $registry->path($name, 'routes/api.php');
                    if (is_file($apiRoutes)) {
                        $this->loadRoutesFrom($apiRoutes);
                    }
                }

                // Load Core dynamic route dispatcher at the end as fallback
                $coreApiRoutes = $registry->path('Core', 'routes/api.php');
                if (is_file($coreApiRoutes)) {
                    $this->loadRoutesFrom($coreApiRoutes);
                }
            });

            // 2. Register Web routes for modules under /{admin_path}
            Route::middleware('web')->group(function () use ($registry) {
                foreach ($registry->all() as $name => $moduleDir) {
                    if ($name === 'Core') {
                        continue;
                    }

                    $webRoutes = $registry->path($name, 'routes/web.php');
                    if (is_file($webRoutes)) {
                        $this->loadRoutesFrom($webRoutes);
                    }
                }

                // Load Core web routes (e.g. SPA fallback)
                $coreWebRoutes = $registry->path('Core', 'routes/web.php');
                if (is_file($coreWebRoutes)) {
                    $this->loadRoutesFrom($coreWebRoutes);
                }
            });
        });

        // 3. Web root redirect to admin path
        Route::middleware('web')->get('/', function () use ($adminPrefix) {
            return redirect('/' . $adminPrefix);
        });
    }
}
