<?php

namespace Modules\Crawler\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Crawler\Repositories\CrawlJobRepository;
use Modules\Crawler\Repositories\CrawlResultRepository;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

class CrawlerRepositoryProvider extends ServiceProvider {

    public function register(): void {
        $this->app->bind(
            CrawlJobRepositoryInterface::class,
            CrawlJobRepository::class
        );

        $this->app->bind(
            CrawlResultRepositoryInterface::class,
            CrawlResultRepository::class
        );
    }

    public function boot(): void {
        //
    }
}
