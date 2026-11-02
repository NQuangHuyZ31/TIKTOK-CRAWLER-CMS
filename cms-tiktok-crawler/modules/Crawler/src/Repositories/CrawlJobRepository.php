<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;

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

    /** Get Lastest Created Job */
    public function getLastestJob(int $limit = 10, array $columns = ['*']) : Collection
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
     * Retrieve paginated crawl results for a specific job with optional filtering.
     */
    public function getResults(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator
    {
        $job = $this->findById($jobId);
        $query = $job ? $job->results() : CrawlResult::where('crawl_job_id', $jobId);

        if (!empty($params['username'])) {
            $query->where('username', 'like', '%' . $params['username'] . '%');
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Check if another crawl job is currently running.
     */
    public function hasRunningJob(int $excludeId = 0): bool
    {
        $query = $this->model->where('status', 'running');
        if ($excludeId > 0) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    /**
     * Retrieve crawl jobs matching a specific status.
     */
    public function findByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)->get();
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
}
