<?php

namespace Modules\Crawler\Services;

use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

class CrawlJobService {

    public function __construct(protected CrawlJobRepositoryInterface $crawlJobRepository, 
                                protected CrawlResultRepositoryInterface $crawlResultRepository) 
    {
    }

    // get all crawl jobs
    public function getAllCrawlJobs() {
        return $this->crawlJobRepository->getAllCrawlJobs();
    }

    // create a new crawl job
    public function createCrawlJob(array $data) {
        return $this->crawlJobRepository->createCrawlJob($data);
    }

    // Get crawl job by ID
    public function getCrawlJobById(int$id) {

        if (!$id || $this->crawlJobRepository->getCrawlJobById($id) === null) {
            return false; // Return false if the ID is not provided or the crawl job is not found
        }

		return $this->crawlJobRepository->getCrawlJobById($id);
	}

    // Get crawl results by job ID
    public function getCrawlResultsByJobId(int $jobId) {

        return $this->crawlResultRepository->getCrawlResultsByJobId($jobId);
    }

    // Get data for dashboard summary
    public function getDashboardSummary() {

        return $this->crawlJobRepository->getDashboardSummary();
    }
}