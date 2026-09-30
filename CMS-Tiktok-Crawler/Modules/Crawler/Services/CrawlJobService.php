<?php

namespace Modules\Crawler\Services;

use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

class CrawlJobService {

    public function __construct(protected CrawlJobRepositoryInterface $crawlJobRepository) {
    }

    public function getAllCrawlJobs() {
        return $this->crawlJobRepository->getAllCrawlJobs();
    }

    public function getDashboardSummary() {

        return $this->crawlJobRepository->getDashboardSummary();
    }
}