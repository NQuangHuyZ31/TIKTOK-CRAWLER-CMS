<?php

namespace Modules\TiktokAccount\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\TiktokAccount\Models\TiktokVideo;

/**
 * @extends BaseRepositoryInterface<TiktokVideo>
 */
interface TiktokVideoRepositoryInterface extends BaseRepositoryInterface
{
    public function getByAccountId(int $accountId, int $perPage = 10, array $params = []): LengthAwarePaginator;

    public function getIdsByVideoIds(array $videoIds): array;

    public function getExistingByVideoIds(array $videoIds): Collection;
}
