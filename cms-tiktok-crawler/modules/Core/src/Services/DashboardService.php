<?php

namespace Modules\Core\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
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
     * Retrieve aggregated statistics, recent crawl jobs, and growth trends for the dashboard.
     */
    public function getOverviewData(int $days = 30): array
    {
        return [
            'crawler_statistics' => $this->getCrawlerStatistics(),
            'tiktok_statistics' => $this->getTiktokStatistics(),
            'recent_jobs' => $this->getRecentCrawlJobs(5),
            'growth_trends' => $this->getGrowthTrends($days),
        ];
    }

    /**
     * Get aggregate Crawler KPI metrics.
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

        try {
            return array_merge($defaultStats, $this->crawlJobRepository->getStatisticsSummary());
        } catch (\Throwable $e) {
            Log::warning('DashboardService: Failed to retrieve crawler statistics: ' . $e->getMessage());
            return $defaultStats;
        }
    }

    /**
     * Get aggregate TikTok Account KPI metrics.
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

        try {
            return array_merge($defaultStats, $this->tiktokAccountRepository->getStatisticSummary());
        } catch (\Throwable $e) {
            Log::warning('DashboardService: Failed to retrieve tiktok statistics: ' . $e->getMessage());
            return $defaultStats;
        }
    }

    /**
     * Get list of top recent crawl jobs.
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

    /**
     * Compute Followers and Likes growth time series over a given number of days.
     */
    public function getGrowthTrends(int $days = 30): array
    {
        $days = max(7, min(90, $days));

        $dailySnapshots = collect();

        try {
            if (DB::getSchemaBuilder()->hasTable('crawl_results')) {
                $endDate = Carbon::now();
                $startDate = $endDate->copy()
                    ->subDays($days - 1)
                    ->startOfDay();

                $dailySnapshots = DB::table('crawl_results')
                    ->selectRaw('
                    DATE(created_at) as date,
                    SUM(followers_count) as total_followers,
                    SUM(likes_count) as total_likes
                ')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', 'success')
                    ->groupByRaw('DATE(created_at)')
                    ->orderBy('date')
                    ->get()
                    ->keyBy('date');
            }
        } catch (\Throwable $e) {
            Log::warning(
                'DashboardService: Failed to fetch growth trends: '
                    . $e->getMessage()
            );
        }

        return [
            'period_days' => $days,

            'followers_growth' => $this->buildTrendSeries(
                title: 'Followers Growth',
                metric: 'followers',
                dailySnapshots: $dailySnapshots,
                field: 'total_followers',
                days: $days,
            ),

            'likes_growth' => $this->buildTrendSeries(
                title: 'Likes Growth',
                metric: 'likes',
                dailySnapshots: $dailySnapshots,
                field: 'total_likes',
                days: $days,
            ),
        ];
    }

    /**
     * Helper to construct a continuous time series array for a specific metric.
     */
    protected function buildTrendSeries(string $title, string $metric, Collection $dailySnapshots, string $field, int $days): array
    {
        $points = [];
        $previousValue = null;

        foreach ($dailySnapshots as $date => $snapshot) {
            $value = (int) ($snapshot->{$field} ?? 0);

            $change = $previousValue !== null
                ? $value - $previousValue
                : 0;

            $dateObj = Carbon::parse($date);

            $points[] = [
                'date' => $dateObj->format('Y-m-d'),
                'label' => $dateObj->format('M d'),
                'value' => $value,
                'change' => $change,
            ];

            $previousValue = $value;
        }

        $firstValue = $points[0]['value'] ?? 0;
        $lastValue = $points !== []
            ? $points[count($points) - 1]['value']
            : 0;

        $netChange = $lastValue - $firstValue;

        $growthRate = $firstValue > 0
            ? round(($netChange / $firstValue) * 100, 1)
            : 0.0;

        return [
            'title' => $title,
            'metric' => $metric,
            'current_value' => $lastValue,
            'previous_value' => $firstValue,
            'net_change' => $netChange,
            'growth_rate' => $growthRate,
            'period_days' => $days,
            'points' => $points,
        ];
    }
}
