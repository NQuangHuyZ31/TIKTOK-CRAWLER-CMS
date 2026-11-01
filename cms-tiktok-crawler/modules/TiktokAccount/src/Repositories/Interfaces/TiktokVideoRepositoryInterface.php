<?php

namespace Modules\TiktokAccount\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;

interface TiktokVideoRepositoryInterface extends BaseRepositoryInterface
{
    public function getByAccountId(int $accountId, int $perPage = 10, array $params = []): LengthAwarePaginator;
}
