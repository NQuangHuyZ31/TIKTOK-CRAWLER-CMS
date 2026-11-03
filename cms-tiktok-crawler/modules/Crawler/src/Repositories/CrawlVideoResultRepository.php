<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlVideoResult;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;

/**
 * @extends BaseRepository<CrawlVideoResult>
 */
class CrawlVideoResultRepository extends BaseRepository implements CrawlVideoResultRepositoryInterface
{
    protected array $searchableColumns = ['video_id', 'username', 'description', 'error_message'];
    protected array $filterableColumns = [
        'status',
        'crawl_job_id',
        'crawl_result_id',
        'tiktok_account_id',
        'username',
        'play_count',
        'digg_count',
        'comment_count',
        'share_count',
        'collect_count',
        'published_at',
        'crawled_at',
    ];
    protected array $sortableColumns = [
        'id',
        'video_id',
        'username',
        'play_count',
        'digg_count',
        'comment_count',
        'share_count',
        'collect_count',
        'play_count_delta',
        'digg_count_delta',
        'published_at',
        'crawled_at',
    ];
    protected array $defaultSort = ['id', 'desc'];

    protected function getModel(): Model
    {
        return new CrawlVideoResult();
    }

    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator
    {
        $request = new Request($params);
        $query = $this->model->with('tiktokVideo')->where('crawl_job_id', $jobId);

        if (!empty($params['username'])) {
            $query->where('username', 'like', '%' . $params['username'] . '%');
        }

        if (!empty($params['crawl_result_id'])) {
            $query->where('crawl_result_id', (int) $params['crawl_result_id']);
        }

        $this->applySearch($query, $request);
        $this->applyFilters($query, $request);
        $this->applySorting($query, $request);

        return $query->paginate(min(max($perPage, 1), 100));
    }

    public function countByStatus(int $jobId, string $status): int
    {
        return $this->model->where('crawl_job_id', $jobId)->where('status', $status)->count();
    }

    public function getExistingVideoIds(int $jobId): array
    {
        return $this->model->where('crawl_job_id', $jobId)
            ->whereNotNull('video_id')
            ->pluck('video_id')
            ->filter()
            ->values()
            ->all();
    }

    public function getByJobAndVideoIds(int $jobId, array $videoIds): \Illuminate\Database\Eloquent\Collection
    {
        return $this->model->where('crawl_job_id', $jobId)
            ->whereIn('video_id', $videoIds)
            ->get()
            ->keyBy('video_id');
    }

    public function deleteByJobId(int $jobId): int
    {
        return $this->model->where('crawl_job_id', $jobId)->delete();
    }
}
