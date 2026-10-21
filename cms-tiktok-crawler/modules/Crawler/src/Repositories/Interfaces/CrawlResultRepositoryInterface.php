<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface CrawlResultRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Retrieve paginated crawl results for a specific job with filtering (standardized name: getByJobId).
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator;
}