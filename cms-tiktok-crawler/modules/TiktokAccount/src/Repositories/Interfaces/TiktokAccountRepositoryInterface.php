<?php

namespace Modules\TiktokAccount\Repositories\Interfaces;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Core\Repositories\Interfaces\BaseRepositoryInterface;
use Modules\TiktokAccount\Models\TiktokAccount;

interface TiktokAccountRepositoryInterface extends BaseRepositoryInterface
{
    public function getStatisticSummary(): array;

    public function getCrawlResults(int $accountId, int $perPage = 10, array $params = []): LengthAwarePaginator|false;

    public function getUsernamesByIds(array $ids): array;

    public function updateStatus(int $id, string $status): ?TiktokAccount;

    public function getAccountByField(string $field, string $value, ?int $excludeId = null): ?TiktokAccount;

    public function updateOrCreateAccount(array $attributes, array $values): TiktokAccount;
}

