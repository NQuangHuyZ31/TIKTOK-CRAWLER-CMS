<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlResultService
{
    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository
    ) {
    }

    /**
     * Retrieve paginated crawl results for a specific job.
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return $this->crawlResultRepository->getByJobId($jobId, $perPage, $filters);
    }

    /**
     * Process incoming crawler webhook events (account crawled or job completed).
     */
    public function handleWebhookEvent(int $jobId, array $data): array
    {
        return DB::transaction(function () use ($data, $jobId) {
            if ($data['event'] === 'account') {
                return $this->storeAccountResult($data, $jobId);
            }

            return $this->completeJob($data, $jobId);
        });
    }

    /**
     * Domain logic: Process single account result event from crawler engine.
     * Updates or creates TikTok account metrics and records crawl result.
     */
    public function storeAccountResult(array $data, int $jobId): array
    {
        $accountData = $data['account'] ?? [];
        $isSuccess = $data['status'] === 'success';

        $rawUsername = $isSuccess
            ? ($accountData['username'] ?? $data['username'] ?? '')
            : ($data['username'] ?? $accountData['username'] ?? '');

        $username = ltrim(trim((string) $rawUsername), '@');

        // Look up existing account in tiktok_accounts by clean username or with @ prefix
        $currentAccount = null;
        if (!empty($username)) {
            $currentAccount = $this->tiktokAccountRepository->getAccountByField('username', $username)
                ?? $this->tiktokAccountRepository->getAccountByField('username', '@' . $username);
        }

        // Save account data to tiktok_accounts table
        $saveAccountData = [
            'followers_count' => $accountData['followers'] ?? 0,
            'following_count' => $accountData['following'] ?? 0,
            'likes_count' => $accountData['likes'] ?? 0,
            'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
            'avatar_url' => $accountData['avatar_url'] ?? null,
            'avatar_path' => $accountData['avatar_path'] ?? null,
            'status' => $accountData['status'] ?? 'active',
            'last_crawled_at' => $accountData['last_crawled_at'] ?? now(),
        ];

        // Update the account's crawled_at timestamp if it hasn't been set yet.
        if ($currentAccount && empty($currentAccount->crawled_at)) {
            $saveAccountData['crawled_at'] = $accountData['crawled_at'] ?? now();
        } elseif (!$currentAccount) {
            $saveAccountData['crawled_at'] = $accountData['crawled_at'] ?? now();
        }

        $account = $currentAccount;
        if ($isSuccess && !empty($username)) {
            if ($currentAccount) {
                $this->tiktokAccountRepository->update($currentAccount->id, $saveAccountData);
                $account = $this->tiktokAccountRepository->findById($currentAccount->id);
            } else {
                $account = $this->tiktokAccountRepository->create(array_merge(
                    ['username' => $username],
                    $saveAccountData
                ));
            }
        }

        $result = $this->crawlResultRepository->create([
            'crawl_job_id' => $jobId,
            'tiktok_account_id' => $account?->id ?? $currentAccount?->id,
            'username' => $username,
            'followers_count' => $accountData['followers'] ?? 0,
            'following_count' => $accountData['following'] ?? 0,
            'likes_count' => $accountData['likes'] ?? 0,
            'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
            'avatar_url' => $accountData['avatar_url'] ?? null,
            'avatar_path' => $accountData['avatar_path'] ?? null,
            'status' => $data['status'],
            'error_message' => $data['error_message'] ?? null,
            'crawled_at' => $accountData['crawled_at'] ?? now(),
        ]);

        return [
            'status_code' => 201,
            'body' => [
                'message' => 'Crawler result stored successfully.',
                'result_id' => $result->id,
                'tiktok_account_id' => $result->tiktok_account_id,
                'data' => [
                    'event' => 'account',
                    'job_id' => $jobId,
                    'status' => $result->status,
                    'account' => $account?->toArray(),
                    'result' => $result->toArray(),
                ],
            ],
        ];
    }

    /**
     * Domain logic: Finalize crawl job status and aggregate counts.
     */
    public function completeJob(array $data, int $jobId): array
    {
        $job = $this->crawlJobRepository->update($jobId, [
            'status' => $data['status'],
            'finished_at' => now(),
            'total_accounts' => $data['total_accounts'],
            'success_count' => $data['success_count'],
            'failed_count' => $data['failed_count'],
            'error_message' => $data['error_message'] ?? null,
        ]);

        return [
            'status_code' => 200,
            'body' => [
                'message' => 'Crawl job updated successfully.',
                'job_id' => $job->id,
                'status' => $job->status,
                'data' => $job->toArray(),
            ],
        ];
    }
}
