<?php

namespace Modules\Crawler\Repositories;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\BaseRepository;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;

class CrawlResultRepository extends BaseRepository implements CrawlResultRepositoryInterface
{
    protected function getModel(): Model
    {
        return new CrawlResult();
    }

    /**
     * Retrieve paginated crawl results for a specific job with optional filtering (standardized name).
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator
    {
        $query = $this->model->where('crawl_job_id', $jobId);

        if (!empty($params['username'])) {
            $query->where('username', 'like', '%' . $params['username'] . '%');
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        return $query->paginate($perPage);
    }
}