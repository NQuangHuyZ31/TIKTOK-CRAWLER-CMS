<?php

namespace Modules\Core\Services;

use Illuminate\Support\Facades\Log;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class DashboardService
{
    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository
    ) {}

    /**
     * Retrieve aggregated statistics and recent crawl jobs for the dashboard.
     *
     * @return array<string, mixed>
     */
    public function getOverviewData(): array
    {
        return [
            'crawler_statistics' => $this->getCrawlerStatistics(),
            'tiktok_statistics' => $this->getTiktokStatistics(),
            'recent_jobs' => $this->getRecentCrawlJobs(5),
        ];
    }

    /**
     * Get aggregate Crawler KPI metrics.
     *
     * @return array<string, int>
     */
    public function getCrawlerStatistics(): array
    {
        $defaultStats = [
            'total_jobs' => 0,
            'total_accounts' => 0,
            'total_success_accounts' => 0,
            'total_failed_accounts' => 0,
            'total_completed_jobs' => 0,
            'total_failed_jobs' => 0,
        ];

        if (!$this->crawlJobRepository) {
            return $defaultStats;
        }

        try {
            return array_merge($defaultStats, $this->crawlJobRepository->getStatisticsSummary());
        } catch (\Throwable $e) {
            Log::warning('DashboardService: Failed to retrieve crawler statistics: ' . $e->getMessage());
            return $defaultStats;
        }
    }

    /**
     * Get aggregate TikTok Account KPI metrics.
     *
     * @return array<string, int>
     */
    public function getTiktokStatistics(): array
    {
        $defaultStats = [
            'total_accounts' => 0,
            'total_followers' => 0,
            'total_following' => 0,
            'total_likes' => 0,
            'total_active_accounts' => 0,
            'total_inactive_accounts' => 0,
        ];

        if (!$this->tiktokAccountRepository) {
            return $defaultStats;
        }

        try {
            return array_merge($defaultStats, $this->tiktokAccountRepository->getStatisticSummary());
        } catch (\Throwable $e) {
            Log::warning('DashboardService: Failed to retrieve tiktok statistics: ' . $e->getMessage());
            return $defaultStats;
        }
    }

    /**
     * Get list of top recent crawl jobs.
     *
     * @param int $limit
     * @return array<int, array<string, mixed>>
     */
    public function getRecentCrawlJobs(int $limit = 4): array
    {
        try {
            $jobs = $this->crawlJobRepository->getLastestJob($limit);

            return $jobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'source_type' => $job->source_type ?? 'usernames',
                    'total_accounts' => (int) ($job->total_accounts ?? 0),
                    'success_count' => (int) ($job->success_count ?? 0),
                    'failed_count' => (int) ($job->failed_count ?? 0),
                    'status' => $job->status ?? 'pending',
                    'created_at' => $job->created_at ? $job->created_at->toISOString() : null,
                    'started_at' => $job->started_at ? (string) $job->started_at : null,
                    'completed_at' => $job->finished_at ? (string) $job->finished_at : null,
                ];
            })->all();
        } catch (\Throwable $e) {
            Log::warning('DashboardService: Failed to retrieve recent crawl jobs: ' . $e->getMessage());
            return [];
        }
    }
}
