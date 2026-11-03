<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

/**
 * @extends BaseRepository<CrawlResult>
 */
class CrawlResultRepository extends BaseRepository implements CrawlResultRepositoryInterface
{
    protected array $searchableColumns = ['username', 'profile_url', 'error_message'];
    protected array $filterableColumns = [
        'status',
        'followers_count',
        'following_count',
        'likes_count',
        'crawled_at',
    ];
    protected array $sortableColumns = [
        'id',
        'username',
        'followers_count',
        'following_count',
        'likes_count',
        'crawled_at',
        'created_at',
        'updated_at',
    ];
    protected array $defaultSort = ['id', 'desc'];

    protected function getModel(): Model
    {
        return new CrawlResult();
    }

    /**
     * Retrieve paginated crawl results for a specific job with optional filtering (standardized name).
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator
    {
        $request = new Request($params);
        $query = $this->model->with('tiktokAccount')->where('crawl_job_id', $jobId);

        if (!empty($params['username'])) {
            $query->where('username', 'like', '%' . $params['username'] . '%');
        }

        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return $query->paginate(min(max($perPage, 1), 100));
    }

    /**
     * Count crawl results by job ID and status.
     */
    public function countByStatus(int $jobId, string $status): int
    {
        return $this->model->where('crawl_job_id', $jobId)->where('status', $status)->count();
    }

    /**
     * Get completed/failed usernames for a crawl job.
     */
    public function getDoneUsernames(int $jobId): array
    {
        return $this->model->where('crawl_job_id', $jobId)
            ->whereIn('status', ['success', 'failed'])
            ->whereNotNull('username')
            ->pluck('username')
            ->toArray();
    }

    /**
     * Delete all crawl results belonging to a specific job.
     */
    public function deleteByJobId(int $jobId): int
    {
        return $this->model->where('crawl_job_id', $jobId)->delete();
    }
}