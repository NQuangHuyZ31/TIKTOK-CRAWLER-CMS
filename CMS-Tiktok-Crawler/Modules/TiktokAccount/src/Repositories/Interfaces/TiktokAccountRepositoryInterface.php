<?php

namespace Modules\TiktokAccount\Repositories\Interfaces;

interface TiktokAccountRepositoryInterface
{
    public function getAll(array $requests);

    public function getTiktokAccountById(int $id);

    public function getAccountByField(string $field, string $value, int $id = null);

    public function updateOrCreateAccount(array $attributes, array $values);

    public function getUsernamesByIds(array $ids): array;

    public function deleteAccountById(int $id): bool;

    public function updateAccountStatus(int $id, string $status);

    public function getCrawlResults(int $accountId, $per_page, array $params = []);

    public function getStatisticSummary();
}
