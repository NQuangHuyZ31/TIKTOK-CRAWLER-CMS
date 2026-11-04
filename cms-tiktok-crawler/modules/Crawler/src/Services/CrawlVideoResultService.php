<?php

namespace Modules\Crawler\Services;

use Illuminate\Support\Carbon;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;

class CrawlVideoResultService
{
    public function __construct(
        protected CrawlVideoResultRepositoryInterface $crawlVideoResultRepository,
        protected TiktokVideoRepositoryInterface $tiktokVideoRepository
    ) {}

    /**
     * Domain logic: Bulk upsert TikTok videos (Master table) and CrawlVideoResult (Job Snapshot table).
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
     * Retrieve count of crawl video results for a specific job and status.
     */
    public function countByStatus(int $jobId, string $status = 'success'): int
    {
        return $this->crawlVideoResultRepository->countByStatus($jobId, $status);
    }
}
