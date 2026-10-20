<?php

namespace Modules\Core\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Core\Support\ModuleRegistry;

/**
 * Base ServiceProvider for modules (inspired by Ureka pattern).
 * Modules can optionally extend this provider to have custom bindings, migrations, and views loaded.
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    protected string $name;

    public function boot(): void
    {
        if (empty($this->name)) {
            return;
        }

        /** @var ModuleRegistry $registry */
        $registry = $this->app->make(ModuleRegistry::class);

        // Load views if directory exists
        $views = $registry->path($this->name, 'resources/views');
        if (is_dir($views)) {
            $this->loadViewsFrom($views, strtolower($this->name));
        }

        // Load migrations if directory exists
        $migrations = $registry->path($this->name, 'database/migrations');
        if (is_dir($migrations)) {
            $this->loadMigrationsFrom($migrations);
        }
    }
}
