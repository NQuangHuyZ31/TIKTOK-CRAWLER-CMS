<?php

namespace Modules\Crawler\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Crawler\Repositories\CrawlJobRepository;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

class CrawlerRepositoryProvider extends ServiceProvider
{   
    public function register(): void
    {
        $this->app->bind(
            CrawlJobRepositoryInterface::class,
            CrawlJobRepository::class
        );
    }

    public function boot(): void
    {
        //
    }
}