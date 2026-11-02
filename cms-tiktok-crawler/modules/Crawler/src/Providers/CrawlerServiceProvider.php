<?php

namespace Modules\Crawler\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\Crawler\Repositories\CrawlJobRepository;
use Modules\Crawler\Repositories\CrawlResultRepository;
use Modules\Crawler\Repositories\CrawlVideoResultRepository;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;

class CrawlerServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Crawler';

    public function register(): void
    {
        $this->app->bind(CrawlJobRepositoryInterface::class, CrawlJobRepository::class);
        $this->app->bind(CrawlResultRepositoryInterface::class, CrawlResultRepository::class);
        $this->app->bind(CrawlVideoResultRepositoryInterface::class, CrawlVideoResultRepository::class);
    }
}
