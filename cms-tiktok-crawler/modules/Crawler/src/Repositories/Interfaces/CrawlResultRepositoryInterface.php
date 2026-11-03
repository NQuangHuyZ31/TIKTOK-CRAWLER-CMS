<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Crawler\Models\CrawlResult;

/**
 * @extends BaseRepositoryInterface<CrawlResult>
 */
interface CrawlResultRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Retrieve paginated crawl results for a specific job with filtering (standardized name: getByJobId).
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator;

    /**
     * Count crawl results by job ID and status.
     */
    public function countByStatus(int $jobId, string $status): int;

    /**
     * Get completed/failed usernames for a crawl job.
     */
    public function getDoneUsernames(int $jobId): array;

    /**
     * Delete all crawl results belonging to a specific job.
     */
    public function deleteByJobId(int $jobId): int;
}