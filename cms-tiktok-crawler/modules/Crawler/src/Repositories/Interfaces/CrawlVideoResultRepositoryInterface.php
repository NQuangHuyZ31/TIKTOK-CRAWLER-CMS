<?php

namespace Modules\Crawler\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface CrawlVideoResultRepositoryInterface extends BaseRepositoryInterface
{
    public function getByJobId(int $jobId, int $perPage = 10, array $params = []): LengthAwarePaginator;

    public function countByStatus(int $jobId, string $status): int;

    public function getExistingVideoIds(int $jobId): array;

    public function getByJobAndVideoIds(int $jobId, array $videoIds): Collection;
}
