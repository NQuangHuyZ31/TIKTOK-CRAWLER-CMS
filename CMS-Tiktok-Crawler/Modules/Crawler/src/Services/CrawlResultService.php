<?php

namespace Modules\Crawler\Services;

use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlResultService {

    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository
    ) {
    }

    // Get crawl results by job ID
    public function getCrawlResultsByJobId(int $jobId, $per_page, array $params = []) {

        return $this->crawlResultRepository->getCrawlResultsByJobId($jobId, $per_page, $params);
    }
}