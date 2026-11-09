<?php

namespace Modules\TiktokAccount\Observers;

use Modules\Crawler\Services\CrawlerSeedChangeService;
use Modules\TiktokAccount\Models\TiktokAccount;

class TiktokAccountObserver
{
    public function __construct(
        protected CrawlerSeedChangeService $seedChangeService
    ) {}

    public function created(TiktokAccount $account): void
    {
        $payload = [
            'username' => $account->username,
            'sec_uid' => $account->sec_uid,
            'nickname' => $account->nickname,
            'status' => $account->status ?? 'active',
        ];

        $this->seedChangeService->recordChange((int) $account->id, 'insert', $payload);
    }

    public function updated(TiktokAccount $account): void
    {
        $isStatusDisabled = $account->isDirty('status') && in_array($account->status, ['inactive', 'banned'], true);
        $operation = $isStatusDisabled ? 'disable' : 'update';

        $payload = [
            'username' => $account->username,
            'sec_uid' => $account->sec_uid,
            'nickname' => $account->nickname,
            'status' => $account->status ?? 'active',
        ];

        $this->seedChangeService->recordChange((int) $account->id, $operation, $payload);
    }

    public function deleted(TiktokAccount $account): void
    {
        $payload = [
            'username' => $account->username,
            'sec_uid' => $account->sec_uid,
            'status' => 'deleted',
        ];

        $this->seedChangeService->recordChange((int) $account->id, 'delete', $payload);
    }

    public function restored(TiktokAccount $account): void
    {
        $payload = [
            'username' => $account->username,
            'sec_uid' => $account->sec_uid,
            'nickname' => $account->nickname,
            'status' => $account->status ?? 'active',
        ];

        $this->seedChangeService->recordChange((int) $account->id, 'update', $payload);
    }
}
