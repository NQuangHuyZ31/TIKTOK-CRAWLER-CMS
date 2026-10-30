<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface CrawlJobRepositoryInterface extends BaseRepositoryInterface
{
    /** Get lasted Created Job */
    public function getLastestJob(int $limit = 10, array $columns = ['*']) : Collection;
    
    /**
     * Retrieve aggregate KPI dashboard statistics across all crawl jobs.
     */
    public function getStatisticsSummary(): array;

    /**
     * Retrieve paginated crawl results for a specific job with filtering.
     */
    public function getResults(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator;

    /**
     * Check if another crawl job is currently running.
     */
    public function hasRunningJob(int $excludeId = 0): bool;

    /**
     * Retrieve crawl jobs matching a specific status.
     */
    public function findByStatus(string $status): Collection;

    /**
     * Retrieve unfinished ('running' and 'queued') crawl jobs ordered by Recovery Priority + FIFO.
     */
    public function getUnfinishedJobs(): Collection;
}
