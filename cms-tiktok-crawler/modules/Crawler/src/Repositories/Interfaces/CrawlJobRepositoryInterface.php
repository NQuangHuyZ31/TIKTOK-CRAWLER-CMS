<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\Crawler\Models\CrawlJob;

/**
 * @extends BaseRepositoryInterface<CrawlJob>
 */
interface CrawlJobRepositoryInterface extends BaseRepositoryInterface
{
    /** Get lasted Created Job */
    public function getLastestJob(int $limit = 10, array $columns = ['*']) : Collection;
    
    /**
     * Retrieve aggregate KPI dashboard statistics across all crawl jobs.
     */
    public function getStatisticsSummary(): array;

    /**
     * Retrieve unfinished ('running' and 'queued') crawl jobs ordered by Recovery Priority + FIFO.
     */
    public function getUnfinishedJobs(): Collection;

    /**
     * Retrieve active crawl job by ID if running or queued.
     */
    public function getActiveJobById(int $jobId): Collection;

    /**
     * Atomically claim a failed crawl job for retry.
     */
    public function claimForRetry(int $id): bool;

    /**
     * Conditionally reset retry-related fields inside the cleanup transaction while the job remains queued.
     */
    public function resetForRetry(int $id, array $attributes): bool;

    /**
     * Conditionally restore a queued claim back to failed upon dispatch or cleanup failure.
     */
    public function restoreFailedClaim(int $id, string $errorMessage): bool;

    /**
     * Atomically synchronize dynamically resolved targets when the job is still queued or running.
     */
    public function syncDynamicTargets(int $id, array $targets): bool;
}
