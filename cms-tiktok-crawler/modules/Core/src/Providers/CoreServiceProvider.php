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

        // Ensure newly scaffolded modules can be autoloaded without composer dump-autoload
        $this->registerModuleAutoloader();

        // Auto-register any custom module providers if they exist
        $this->registerModuleProviders();
    }

    /**
     * Register a lightweight PSR-4 fallback autoloader for Modules\* namespaces.
     */
    protected function registerModuleAutoloader(): void
    {
        spl_autoload_register(function (string $class): void {
            if (!str_starts_with($class, 'Modules\\')) {
                return;
            }

            $relative = substr($class, strlen('Modules\\'));
            $parts = explode('\\', $relative, 2);
            if (count($parts) !== 2) {
                return;
            }

            [$moduleName, $subClass] = $parts;
            $baseDir = base_path(trim((string) config('modules.path', 'modules'), '/'));
            $file = $baseDir . DIRECTORY_SEPARATOR . $moduleName . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR
                . str_replace('\\', DIRECTORY_SEPARATOR, $subClass) . '.php';

            if (is_file($file)) {
                require_once $file;
            }
        });
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
        });

        // 2. Register Web routes for modules
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
                
                $coreWebRoutes = $registry->path('Core', 'routes/web.php');
                if (is_file($coreWebRoutes)) {
                    $this->loadRoutesFrom($coreWebRoutes);
                }
            });

        Route::middleware('web')->get('/', function () use ($adminPrefix) {
            return redirect('/' . $adminPrefix . '/dashboard');
        });
    }
}
