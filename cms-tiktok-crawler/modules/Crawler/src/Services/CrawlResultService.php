<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Modules\Core\Services\StorageService;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;

class CrawlResultService
{

    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected StorageService $storageService,
        protected CrawlVideoResultRepositoryInterface $crawlVideoResultRepository,
        protected TiktokVideoRepositoryInterface $tiktokVideoRepository
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
            $videosCrawledCount = $this->storeVideoResults($jobId, $result->id, $result->tiktok_account_id, $username, $videosPayload);
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
     * Automatically updates existing videos in `tiktok_videos` with latest statistics and computes
     * growth deltas (`*_delta`) against the previous crawl snapshot.
     */
    public function storeVideoResults(int $jobId, int $crawlResultId, ?int $tiktokAccountId, string $username, array $videos): int
    {
        // Deduplicate incoming videos by video_id
        $normalizedByVideoId = [];
        foreach ($videos as $video) {
            if (!is_array($video) || empty($video['video_id'])) {
                continue;
            }
            $videoId = trim((string) $video['video_id']);
            if ($videoId === '') {
                continue;
            }
            $normalizedByVideoId[$videoId] = $video;
        }

        if (empty($normalizedByVideoId)) {
            return 0;
        }

        $videoIds = array_keys($normalizedByVideoId);
        $now = now();

        // 1. Fetch existing master videos in 1 query (to preserve first crawled_at & compute deltas)
        $existingMasters = $this->tiktokVideoRepository->getExistingByVideoIds($videoIds);

        // Also check if THIS job already wrote snapshots (for retry/resume idempotency)
        $existingJobSnapshots = $this->crawlVideoResultRepository->getByJobAndVideoIds($jobId, $videoIds);

        $masterRows = [];
        $deltasByVideoId = [];

        foreach ($normalizedByVideoId as $videoId => $video) {
            $existingMaster = $existingMasters->get($videoId);
            $existingSnapshot = $existingJobSnapshots->get($videoId);

            $playCount = max(0, (int) ($video['play_count'] ?? $video['views'] ?? 0));
            $diggCount = max(0, (int) ($video['digg_count'] ?? $video['likes'] ?? 0));
            $commentCount = max(0, (int) ($video['comment_count'] ?? $video['comments'] ?? 0));
            $shareCount = max(0, (int) ($video['share_count'] ?? $video['shares'] ?? 0));
            $collectCount = max(0, (int) ($video['collect_count'] ?? $video['saves'] ?? 0));

            if (!$existingMaster) {
                $deltasByVideoId[$videoId] = [
                    'play_count_delta' => 0,
                    'digg_count_delta' => 0,
                    'comment_count_delta' => 0,
                    'share_count_delta' => 0,
                    'collect_count_delta' => 0,
                ];
            } elseif ($existingSnapshot) {
                // Same job retrying: compute delta relative to baseline prior to this job
                $basePlay = (int) $existingSnapshot->play_count - (int) $existingSnapshot->play_count_delta;
                $baseDigg = (int) $existingSnapshot->digg_count - (int) $existingSnapshot->digg_count_delta;
                $baseComment = (int) $existingSnapshot->comment_count - (int) $existingSnapshot->comment_count_delta;
                $baseShare = (int) $existingSnapshot->share_count - (int) $existingSnapshot->share_count_delta;
                $baseCollect = (int) $existingSnapshot->collect_count - (int) $existingSnapshot->collect_count_delta;

                $deltasByVideoId[$videoId] = [
                    'play_count_delta' => $playCount - $basePlay,
                    'digg_count_delta' => $diggCount - $baseDigg,
                    'comment_count_delta' => $commentCount - $baseComment,
                    'share_count_delta' => $shareCount - $baseShare,
                    'collect_count_delta' => $collectCount - $baseCollect,
                ];
            } else {
                // Existing video crawled in a new job: delta = new_stat - old_master_stat
                $deltasByVideoId[$videoId] = [
                    'play_count_delta' => $playCount - (int) $existingMaster->play_count,
                    'digg_count_delta' => $diggCount - (int) $existingMaster->digg_count,
                    'comment_count_delta' => $commentCount - (int) $existingMaster->comment_count,
                    'share_count_delta' => $shareCount - (int) $existingMaster->share_count,
                    'collect_count_delta' => $collectCount - (int) $existingMaster->collect_count,
                ];
            }

            $crawledAt = !empty($video['crawled_at']) ? Carbon::parse($video['crawled_at']) : $now;
            $publishedAt = !empty($video['published_at'])
                ? Carbon::parse($video['published_at'])
                : ($existingMaster?->published_at);

            $hashtags = $video['hashtags'] ?? ($existingMaster?->hashtags ?? []);
            $hashtagsJson = is_string($hashtags) ? $hashtags : json_encode(array_values((array) $hashtags));

            $videoUsername = ltrim(trim((string) ($video['username'] ?? $username)), '@');
            $videoUrl = $video['video_url']
                ?? $existingMaster?->video_url
                ?? "https://www.tiktok.com/@{$videoUsername}/video/{$videoId}";

            $masterRows[] = [
                'tiktok_account_id' => $tiktokAccountId ?? $existingMaster?->tiktok_account_id,
                'video_id' => $videoId,
                'username' => $videoUsername,
                'video_url' => $videoUrl,
                'description' => $video['description'] ?? $existingMaster?->description,
                'hashtags' => $hashtagsJson,
                'duration' => max(0, (int) ($video['duration'] ?? $existingMaster?->duration ?? 0)),
                'width' => max(0, (int) ($video['width'] ?? $existingMaster?->width ?? 0)),
                'height' => max(0, (int) ($video['height'] ?? $existingMaster?->height ?? 0)),
                'definition' => $video['definition'] ?? $existingMaster?->definition,
                'cover_url' => $video['cover_url'] ?? $existingMaster?->cover_url,
                'dynamic_cover_url' => $video['dynamic_cover_url'] ?? $existingMaster?->dynamic_cover_url,
                'music_id' => $video['music_id'] ?? $existingMaster?->music_id,
                'music_title' => $video['music_title'] ?? $existingMaster?->music_title,
                'music_author' => $video['music_author'] ?? $existingMaster?->music_author,
                'is_original_sound' => (bool) ($video['is_original_sound'] ?? $existingMaster?->is_original_sound ?? false),
                'is_pinned' => (bool) ($video['is_pinned'] ?? $existingMaster?->is_pinned ?? false),
                'is_ad' => (bool) ($video['is_ad'] ?? $existingMaster?->is_ad ?? false),
                'play_count' => $playCount,
                'digg_count' => $diggCount,
                'comment_count' => $commentCount,
                'share_count' => $shareCount,
                'collect_count' => $collectCount,
                'status' => in_array($video['status'] ?? 'active', ['active', 'deleted', 'private'], true)
                    ? ($video['status'] ?? 'active')
                    : 'active',
                'published_at' => $publishedAt,
                'crawled_at' => $existingMaster?->crawled_at ?? $crawledAt,
                'last_crawled_at' => $crawledAt,
                'deleted_at' => null,
                'created_at' => $existingMaster?->created_at ?? $now,
                'updated_at' => $now,
            ];
        }

        // 2. Bulk upsert into master `tiktok_videos` table
        $this->tiktokVideoRepository->upsert(
            $masterRows,
            ['video_id'],
            [
                'tiktok_account_id',
                'username',
                'video_url',
                'description',
                'hashtags',
                'duration',
                'width',
                'height',
                'definition',
                'cover_url',
                'dynamic_cover_url',
                'music_id',
                'music_title',
                'music_author',
                'is_original_sound',
                'is_pinned',
                'is_ad',
                'play_count',
                'digg_count',
                'comment_count',
                'share_count',
                'collect_count',
                'status',
                'published_at',
                'crawled_at',
                'last_crawled_at',
                'deleted_at',
                'updated_at',
            ]
        );

        // 3. Map video_id -> tiktok_videos.id and bulk upsert into `crawl_video_results`
        $masterIdMap = $this->tiktokVideoRepository->getIdsByVideoIds($videoIds);

        $snapshotRows = [];
        foreach ($masterRows as $row) {
            $videoId = $row['video_id'];
            $deltas = $deltasByVideoId[$videoId];

            $snapshotRows[] = [
                'crawl_job_id' => $jobId,
                'crawl_result_id' => $crawlResultId,
                'tiktok_account_id' => $row['tiktok_account_id'],
                'tiktok_video_id' => $masterIdMap[$videoId] ?? null,
                'video_id' => $videoId,
                'username' => $row['username'],
                'video_url' => $row['video_url'],
                'description' => $row['description'],
                'hashtags' => $row['hashtags'],
                'cover_url' => $row['cover_url'],
                'duration' => $row['duration'],
                'play_count' => $row['play_count'],
                'digg_count' => $row['digg_count'],
                'comment_count' => $row['comment_count'],
                'share_count' => $row['share_count'],
                'collect_count' => $row['collect_count'],
                'play_count_delta' => $deltas['play_count_delta'],
                'digg_count_delta' => $deltas['digg_count_delta'],
                'comment_count_delta' => $deltas['comment_count_delta'],
                'share_count_delta' => $deltas['share_count_delta'],
                'collect_count_delta' => $deltas['collect_count_delta'],
                'published_at' => $row['published_at'],
                'status' => 'success',
                'error_code' => null,
                'error_message' => null,
                'crawled_at' => $row['last_crawled_at'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->crawlVideoResultRepository->upsert(
            $snapshotRows,
            ['crawl_job_id', 'video_id'],
            [
                'crawl_result_id',
                'tiktok_account_id',
                'tiktok_video_id',
                'username',
                'video_url',
                'description',
                'hashtags',
                'cover_url',
                'duration',
                'play_count',
                'digg_count',
                'comment_count',
                'share_count',
                'collect_count',
                'play_count_delta',
                'digg_count_delta',
                'comment_count_delta',
                'share_count_delta',
                'collect_count_delta',
                'published_at',
                'status',
                'error_code',
                'error_message',
                'crawled_at',
                'updated_at',
            ]
        );

        return count($snapshotRows);
    }

    /**
     * Domain logic: Finalize crawl job status and recalculate aggregate counts from DB.
     */
    public function completeJob(array $data, int $jobId): array
    {
        $dbSuccess = $this->crawlResultRepository->countByStatus($jobId, 'success');
        $dbFailed = $this->crawlResultRepository->countByStatus($jobId, 'failed');
        $totalVideosCrawled = $this->crawlVideoResultRepository->countByStatus($jobId, 'success');
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
        $totalVideosCrawled = $this->crawlVideoResultRepository->countByStatus($jobId, 'success');

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
