<?php

namespace Modules\Core\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Modules\Core\Services\StorageService;
use Modules\Core\Support\ModuleRegistry;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(StorageService::class, function () {
            return new StorageService();
        });

        $this->app->scoped(ModuleRegistry::class, function () {
            return new ModuleRegistry(config('modules.path'), config('modules.disabled', []));
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
        $this->mergeConfigFrom(dirname(__DIR__, 2) . '/configs/modules.php', 'modules');
        $this->loadViewsFrom(dirname(__DIR__, 2) . '/resources/views', 'core');
        $this->registerModuleRoutes();
        $this->registerBladeDirectives();
        $this->registerModuleMigrations();

        $this->app->terminating(function () {
            if ($this->app->bound(ModuleRegistry::class)) {
                $this->app->make(ModuleRegistry::class)->resetDomCache();
            }
        });
    }

    /**
     * Auto-discover and register all module migrations.
     * Each module maintains its own database/migrations directory.
     */
    protected function registerModuleMigrations(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = $this->app->make(ModuleRegistry::class);

        foreach ($registry->all() as $name => $moduleDir) {
            $migrationDir = $registry->path($name, 'database/migrations');
            if (is_dir($migrationDir)) {
                $this->loadMigrationsFrom($migrationDir);
            }
        }
    }

    /**
     * Register modular Blade directives for DOM-ing assets from entrypoints.json.
     */
    protected function registerBladeDirectives(): void
    {
        Blade::directive('moduleCss', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderCss($expr); ?>";
        });

        Blade::directive('moduleJs', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderJs($expr); ?>";
        });

        Blade::directive('moduleAssets', function ($expression) {
            $expr = $expression ?: 'null';
            return "<?php echo app(\\Modules\\Core\\Support\\ModuleRegistry::class)->renderAssets($expr); ?>";
        });
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
        $adminPrefix = trim((string) config('admin.admin_path', config('admin.path', 'admin')), '/');

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

                $apiRoute = $registry->path('Core', 'routes/api.php');
                if (is_file($apiRoute)) {
                    $this->loadRoutesFrom($apiRoute);
                }
            });

            // 2. Register Web routes for modules under /{admin_path}
            Route::middleware('web')->group(function () use ($registry) {
                $coreWebRoutes = $registry->path('Core', 'routes/web.php');
                if (is_file($coreWebRoutes)) {
                    $this->loadRoutesFrom($coreWebRoutes);
                }
            });
        });

        Route::middleware('web')->get('/', function () use ($adminPrefix) {
            return redirect('/' . $adminPrefix);
        });
    }
}
