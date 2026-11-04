<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Modules\Core\Services\StorageService;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Services\CrawlVideoResultService;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlResultService
{
    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected StorageService $storageService,
        protected CrawlVideoResultService $videoResultService
    ) {}

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
                $storedAvatarPath = $this->storageService->storeAvatar(
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
            } catch (\Throwable $e) {
                Log::warning("Failed to store avatar for @{$username}, continuing without avatar file: " . $e->getMessage());
                $storedAvatarPath = null;
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

        $videosPayload = $data['videos'] ?? ($accountData['videos'] ?? []);
        if (!is_array($videosPayload)) {
            $videosPayload = [];
        }

        $videoCount = isset($accountData['video_count'])
            ? (int) $accountData['video_count']
            : ($currentAccount?->video_count ?? count($videosPayload));

        // Save account data to tiktok_accounts table (avatar_url is never stored)
        $saveAccountData = [
            'followers_count' => $accountData['followers'] ?? 0,
            'following_count' => $accountData['following'] ?? 0,
            'likes_count' => $accountData['likes'] ?? 0,
            'video_count' => $videoCount,
            'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
            'avatar_url' => null,
            'avatar_path' => $resolvedAvatarPath,
            'status' => $accountData['status'] ?? 'active',
            'last_crawled_at' => $accountData['last_crawled_at'] ?? now(),
        ];

        if (!empty($accountData['sec_uid'])) {
            $saveAccountData['sec_uid'] = $accountData['sec_uid'];
        }
        if (!empty($accountData['nickname'])) {
            $saveAccountData['nickname'] = $accountData['nickname'];
        }
        if (array_key_exists('bio', $accountData) && $accountData['bio'] !== null) {
            $saveAccountData['bio'] = $accountData['bio'];
        }
        if (array_key_exists('is_verified', $accountData) && $accountData['is_verified'] !== null) {
            $saveAccountData['is_verified'] = (bool) $accountData['is_verified'];
        }

        if (!$currentAccount || empty($currentAccount->crawled_at)) {
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
        $result = $this->crawlResultRepository->updateOrCreate(
            [
                'crawl_job_id' => $jobId,
                'username' => $username,
            ],
            [
                'tiktok_account_id' => $account?->id ?? $currentAccount?->id,
                'nickname' => $accountData['nickname'] ?? $account?->nickname,
                'bio' => $accountData['bio'] ?? $account?->bio,
                'followers_count' => $accountData['followers'] ?? 0,
                'following_count' => $accountData['following'] ?? 0,
                'likes_count' => $accountData['likes'] ?? 0,
                'video_count' => $videoCount,
                'profile_url' => $accountData['profile_url'] ?? $data['profile_url'] ?? null,
                'avatar_url' => null,
                'avatar_path' => $resolvedAvatarPath,
                'status' => $data['status'],
                'error_code' => $data['error_code'] ?? null,
                'error_message' => $data['error_message'] ?? null,
                'crawled_at' => $accountData['crawled_at'] ?? now(),
            ]
        );

        // Process and upsert video metadata + statistics + job snapshots
        $videosCrawledCount = 0;
        if ($isSuccess && !empty($videosPayload)) {
            $videosCrawledCount = $this->videoResultService->storeVideoResults($jobId, $result->id, $result->tiktok_account_id, $username, $videosPayload);
            $this->crawlResultRepository->update($result->id, ['videos_crawled_count' => $videosCrawledCount]);
        }

        // Recalculate job counts directly from DB to guarantee accuracy
        $this->syncJobCounts($jobId);

        return [
            'status_code' => 201,
            'body' => [
                'message' => 'Crawler result stored successfully.',
                'result_id' => $result->id,
                'tiktok_account_id' => $result->tiktok_account_id,
                'avatar_path' => $resolvedAvatarPath,
                'videos_crawled_count' => $videosCrawledCount,
                'data' => [
                    'event' => 'account',
                    'job_id' => $jobId,
                    'status' => $result->status,
                    'account' => $account?->toArray(),
                    'result' => $result->fresh()?->toArray(),
                    'videos_crawled_count' => $videosCrawledCount,
                ],
            ],
        ];
    }

    /**
     * Domain logic: Bulk upsert TikTok videos (Master table) and CrawlVideoResult (Job Snapshot table).
     */
    public function storeVideoResults(int $jobId, int $crawlResultId, ?int $tiktokAccountId, string $username, array $videos): int
    {
        return $this->videoResultService->storeVideoResults($jobId, $crawlResultId, $tiktokAccountId, $username, $videos);
    }

    /**
     * Domain logic: Finalize crawl job status and recalculate aggregate counts from DB.
     */
    public function completeJob(array $data, int $jobId): array
    {
        $dbSuccess = $this->crawlResultRepository->countByStatus($jobId, 'success');
        $dbFailed = $this->crawlResultRepository->countByStatus($jobId, 'failed');
        $totalVideosCrawled = $this->videoResultService->countByStatus($jobId, 'success');
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
            'total_videos_crawled' => $totalVideosCrawled,
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

        $successCount = $this->crawlResultRepository->countByStatus($jobId, 'success');
        $failedCount = $this->crawlResultRepository->countByStatus($jobId, 'failed');
        $totalVideosCrawled = $this->videoResultService->countByStatus($jobId, 'success');

        $update = [
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'total_videos_crawled' => $totalVideosCrawled,
            'error_message' => null,
        ];

        if ($currentJob->status === 'queued') {
            $update['status'] = 'running';
            $update['started_at'] = $currentJob->started_at ?? now();
        }

        $this->crawlJobRepository->update($jobId, $update);
    }
}
