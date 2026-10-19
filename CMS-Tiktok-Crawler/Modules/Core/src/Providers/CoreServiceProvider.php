<?php

namespace Modules\Core\Providers;

use Illuminate\Support\ServiceProvider;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        config(['view.paths' => array_merge(
            (array) config('view.paths', []),
            [dirname(__DIR__, 2).'/resources/views'],
        )]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadViewsFrom(dirname(__DIR__, 2).'/resources/views', 'core');
    }
}
