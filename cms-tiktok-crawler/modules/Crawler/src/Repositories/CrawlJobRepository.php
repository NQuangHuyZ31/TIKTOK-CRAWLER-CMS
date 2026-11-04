<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

/**
 * @extends BaseRepository<CrawlJob>
 */
class CrawlJobRepository extends BaseRepository implements CrawlJobRepositoryInterface
{
    protected function getModel(): Model
    {
        return new CrawlJob();
    }

    public function findById(int|string $id): ?Model
    {
        return $this->model->with(['creator', 'starter'])->find($id);
    }

    public function create(array $attributes): Model
    {
        $model = parent::create($attributes);

        return $model->load(['creator', 'starter']);
    }

    /**
     * Retrieve latest created jobs for dashboard overview.
     */
    public function getLastestJob(int $limit = 10, array $columns = ['*']): Collection
    {
        return $this->model->orderBy('id', 'desc')->limit($limit)->get($columns);
    }

    /**
     * Retrieve aggregate KPI dashboard statistics across all crawl jobs.
     */
    public function getStatisticsSummary(): array
    {
        return [
            'total_jobs' => $this->model->count(),
            'total_accounts' => (int) $this->model->sum('total_accounts'),
            'total_success_accounts' => (int) $this->model->sum('success_count'),
            'total_failed_accounts' => (int) $this->model->sum('failed_count'),
            'total_completed_jobs' => $this->model->where('status', 'completed')->count(),
            'total_failed_jobs' => $this->model->where('status', 'failed')->count(),
        ];
    }

    /**
     * Retrieve unfinished ('running' and 'queued') crawl jobs ordered by Recovery Priority + FIFO.
     */
    public function getUnfinishedJobs(): Collection
    {
        return $this->model
            ->whereIn('status', ['running', 'queued'])
            ->orderByRaw("CASE WHEN status = 'running' THEN 0 ELSE 1 END ASC")
            ->orderBy('queued_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    /**
     * Retrieve active crawl job by ID if running or queued.
     */
    public function getActiveJobById(int $jobId): Collection
    {
        return $this->model
            ->where('id', $jobId)
            ->whereIn('status', ['running', 'queued'])
            ->get();
    }

    /**
     * Atomically claim a failed crawl job for retry.
     */
    public function claimForRetry(int $id): bool
    {
        return (bool) $this->model
            ->where('id', $id)
            ->where('status', 'failed')
            ->update([
                'status' => 'queued',
                'queued_at' => now(),
                'error_message' => null,
                'updated_at' => now(),
            ]);
    }

    /**
     * Conditionally reset retry-related fields inside the cleanup transaction while the job remains queued.
     */
    public function resetForRetry(int $id, array $attributes): bool
    {
        $job = $this->model
            ->where('id', $id)
            ->where('status', 'queued')
            ->lockForUpdate()
            ->first();

        if (!$job) {
            return false;
        }

        return (bool) $job->update($attributes);
    }

    /**
     * Conditionally restore a queued claim back to failed upon dispatch or cleanup failure.
     */
    public function restoreFailedClaim(int $id, string $errorMessage): bool
    {
        return (bool) $this->model
            ->where('id', $id)
            ->where('status', 'queued')
            ->update([
                'status' => 'failed',
                'error_message' => $errorMessage,
                'updated_at' => now(),
            ]);
    }

    /**
     * Atomically synchronize dynamically resolved targets when the job is still queued or running.
     */
    public function syncDynamicTargets(int $id, array $targets): bool
    {
        return (bool) $this->model
            ->where('id', $id)
            ->whereIn('status', ['queued', 'running'])
            ->update([
                'data_crawls' => json_encode(array_values($targets)),
                'total_accounts' => count($targets),
                'updated_at' => now(),
            ]);
    }
}
