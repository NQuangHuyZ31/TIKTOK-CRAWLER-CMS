<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlResultService
{
    protected AvatarStorageService $avatarStorageService;

    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        ?AvatarStorageService $avatarStorageService = null
    ) {
        $this->avatarStorageService = $avatarStorageService ?? app(AvatarStorageService::class);
    }

    /**
     * Retrieve paginated crawl results for a specific job.
     */
    public function getByJobId(int $jobId, int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return $this->crawlResultRepository->getByJobId($jobId, $perPage, $filters);
    }

    /**
     * Process incoming crawler webhook events ('started', 'account', or 'completed').
     */
    public function handleWebhookEvent(int $jobId, array $data): array
    {
        return DB::transaction(function () use ($data, $jobId) {
            if ($data['event'] === 'started') {
                return $this->startJob($data, $jobId);
            }

            if ($data['event'] === 'paused') {
                return $this->pauseJob($data, $jobId);
            }

            if ($data['event'] === 'account') {
                return $this->storeAccountResult($data, $jobId);
            }

            return $this->completeJob($data, $jobId);
        });
    }

    /**
     * Domain logic: Mark a queued crawl job as running when a Python worker picks it up.
     */
    public function startJob(array $data, int $jobId): array
    {
        $currentJob = $this->crawlJobRepository->findById($jobId);
        $updateData = [
            'status' => 'running',
            'worker_id' => $data['worker_id'] ?? $currentJob?->worker_id,
            'started_at' => $currentJob?->started_at ?? now(),
            'error_message' => null,
        ];

        if (!empty($data['resumed'])) {
            $updateData['resume_count'] = (int) ($currentJob?->resume_count ?? 0) + 1;
        }

        $job = $this->crawlJobRepository->update($jobId, $updateData);

        return [
            'status_code' => 200,
            'body' => [
                'message' => 'Crawl job started successfully.',
                'job_id' => $job->id,
                'status' => $job->status,
                'data' => $job->toArray(),
            ],
        ];
    }

    /**
     * Domain logic: Record that the crawler service shut down while keeping job status
     * in 'running'/'queued' so Crash Recovery automatically resumes when service restarts.
     */
    public function pauseJob(array $data, int $jobId): array
    {
        $currentJob = $this->crawlJobRepository->findById($jobId);
        $preservedStatus = in_array($currentJob?->status, ['running', 'queued'], true)
            ? $currentJob->status
            : ($data['status'] ?? 'running');

        $job = $this->crawlJobRepository->update($jobId, [
            'status' => $preservedStatus,
            'error_message' => $data['error_message']
                ?? CrawlJobService::SERVICE_SHUTDOWN_MESSAGE,
        ]);

        return [
            'status_code' => 200,
            'body' => [
                'message' => 'Crawl job paused awaiting service restart.',
                'job_id' => $job->id,
                'status' => $job->status,
                'data' => $job->toArray(),
            ],
        ];
    }

    /**
     * Domain logic: Process single account result event from crawler engine.
     * Idempotently upserts CrawlResult by (crawl_job_id, username), stores avatar binary,
     * updates TiktokAccount, and recalculates job counters via COUNT.
     */
    public function storeAccountResult(array $data, int $jobId): array
    {
        $accountData = $data['account'] ?? [];
        $isSuccess = $data['status'] === 'success';

        $rawUsername = $isSuccess
            ? ($accountData['username'] ?? $data['username'] ?? '')
            : ($data['username'] ?? $accountData['username'] ?? '');

        $username = ltrim(trim((string) $rawUsername), '@');

        // Validate and store base64 avatar if supplied
        $storedAvatarPath = null;
        $avatarPayload = $data['avatar'] ?? ($accountData['avatar'] ?? null);
        if (!empty($avatarPayload) && is_array($avatarPayload)) {
            try {
                $storedAvatarPath = $this->avatarStorageService->storeFromBase64(
                    $username !== '' ? $username : 'account',
                    $avatarPayload
                );
            } catch (InvalidArgumentException $e) {
                return [
                    'status_code' => 422,
                    'body' => [
                        'message' => $e->getMessage(),
                        'errors' => ['avatar' => [$e->getMessage()]],
                    ],
                ];
            }
        }

        // Look up existing account in tiktok_accounts by clean username or with @ prefix
        $currentAccount = null;
        if ($username !== '') {
            $currentAccount = $this->tiktokAccountRepository->getAccountByField('username', $username)
                ?? $this->tiktokAccountRepository->getAccountByField('username', '@' . $username);
        }

        $resolvedAvatarPath = $storedAvatarPath
            ?? ($accountData['avatar_path'] ?? $currentAccount?->avatar_path ?? null);

        // Save account data to tiktok_accounts table (avatar_url is never stored)
        $saveAccountData = [
            'followers_count' => $accountData['followers'] ?? 0,
            'following_count' => $accountData['following'] ?? 0,
            'likes_count' => $accountData['likes'] ?? 0,
            'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
            'avatar_url' => null,
            'avatar_path' => $resolvedAvatarPath,
            'status' => $accountData['status'] ?? 'active',
            'last_crawled_at' => $accountData['last_crawled_at'] ?? now(),
        ];

        if ($currentAccount && empty($currentAccount->crawled_at)) {
            $saveAccountData['crawled_at'] = $accountData['crawled_at'] ?? now();
        } elseif (!$currentAccount) {
            $saveAccountData['crawled_at'] = $accountData['crawled_at'] ?? now();
        }

        $account = $currentAccount;
        if ($isSuccess && $username !== '') {
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

        // Idempotent upsert by UNIQUE (crawl_job_id, username)
        $result = CrawlResult::updateOrCreate(
            [
                'crawl_job_id' => $jobId,
                'username' => $username,
            ],
            [
                'tiktok_account_id' => $account?->id ?? $currentAccount?->id,
                'followers_count' => $accountData['followers'] ?? 0,
                'following_count' => $accountData['following'] ?? 0,
                'likes_count' => $accountData['likes'] ?? 0,
                'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
                'avatar_url' => null,
                'avatar_path' => $resolvedAvatarPath,
                'status' => $data['status'],
                'error_code' => $data['error_code'] ?? null,
                'error_message' => $data['error_message'] ?? null,
                'crawled_at' => $accountData['crawled_at'] ?? now(),
            ]
        );

        // Recalculate job counts directly from DB to guarantee accuracy
        $this->syncJobCounts($jobId);

        return [
            'status_code' => 201,
            'body' => [
                'message' => 'Crawler result stored successfully.',
                'result_id' => $result->id,
                'tiktok_account_id' => $result->tiktok_account_id,
                'avatar_path' => $resolvedAvatarPath,
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
     * Domain logic: Finalize crawl job status and recalculate aggregate counts from DB.
     */
    public function completeJob(array $data, int $jobId): array
    {
        $dbSuccess = CrawlResult::where('crawl_job_id', $jobId)->where('status', 'success')->count();
        $dbFailed = CrawlResult::where('crawl_job_id', $jobId)->where('status', 'failed')->count();
        $hasDbResults = ($dbSuccess + $dbFailed) > 0;

        $successCount = $hasDbResults ? $dbSuccess : (int) ($data['success_count'] ?? 0);
        $failedCount = $hasDbResults ? $dbFailed : (int) ($data['failed_count'] ?? 0);

        $finalStatus = $data['status'];
        if ($finalStatus === 'completed' && $successCount === 0 && $failedCount > 0) {
            $finalStatus = 'failed';
        }

        $job = $this->crawlJobRepository->update($jobId, [
            'status' => $finalStatus,
            'finished_at' => now(),
            'total_accounts' => $data['total_accounts'],
            'success_count' => $successCount,
            'failed_count' => $failedCount,
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

    protected function syncJobCounts(int $jobId): void
    {
        $currentJob = $this->crawlJobRepository->findById($jobId);
        if (!$currentJob) {
            return;
        }

        $successCount = CrawlResult::where('crawl_job_id', $jobId)->where('status', 'success')->count();
        $failedCount = CrawlResult::where('crawl_job_id', $jobId)->where('status', 'failed')->count();

        $update = [
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'error_message' => null,
        ];

        if ($currentJob->status === 'queued') {
            $update['status'] = 'running';
            $update['started_at'] = $currentJob->started_at ?? now();
        }

        $this->crawlJobRepository->update($jobId, $update);
    }
}
