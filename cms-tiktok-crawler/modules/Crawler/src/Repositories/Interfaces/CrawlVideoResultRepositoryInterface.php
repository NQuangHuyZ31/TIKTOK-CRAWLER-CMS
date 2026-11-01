<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface CrawlVideoResultRepositoryInterface extends BaseRepositoryInterface
{
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator;
}
