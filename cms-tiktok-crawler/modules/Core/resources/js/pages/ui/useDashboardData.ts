import { useState, useCallback, useEffect } from 'react';
import { getDashboardOverview, getGrowthTrends } from '../../Action/dashboard';
import type { CrawlerStatistics, TiktokStatistics, CrawlJobItem, DashboardGrowthTrends } from './types';

export function useDashboardData(initialPeriod = 30) {
	const [crawlerStats, setCrawlerStats] = useState<CrawlerStatistics | null>(null);
	const [tiktokStats, setTiktokStats] = useState<TiktokStatistics | null>(null);
	const [recentJobs, setRecentJobs] = useState<CrawlJobItem[]>([]);
	const [growthTrends, setGrowthTrends] = useState<DashboardGrowthTrends | null>(null);
	const [selectedPeriod, setSelectedPeriod] = useState<number>(initialPeriod);
	const [growthLoading, setGrowthLoading] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [lastUpdated, setLastUpdated] = useState<string>('');

	const loadDashboardData = useCallback(
		async (isRefresh = false, days = selectedPeriod) => {
			if (isRefresh) setRefreshing(true);
			else setLoading(true);
			setError('');

			try {
				const res = await getDashboardOverview(days);
				const overview = res?.data;

				if (overview) {
					if (overview.crawler_statistics) {
						setCrawlerStats({
							total_jobs: Number(overview.crawler_statistics.total_jobs || 0),
							total_accounts: Number(overview.crawler_statistics.total_accounts || 0),
							total_success_accounts: Number(overview.crawler_statistics.total_success_accounts || 0),
							total_failed_accounts: Number(overview.crawler_statistics.total_failed_accounts || 0),
							total_completed_jobs: Number(overview.crawler_statistics.total_completed_jobs || 0),
							total_failed_jobs: Number(overview.crawler_statistics.total_failed_jobs || 0),
						});
					}

					if (overview.tiktok_statistics) {
						setTiktokStats({
							total_accounts: Number(overview.tiktok_statistics.total_accounts || 0),
							total_followers: Number(overview.tiktok_statistics.total_followers || 0),
							total_following: Number(overview.tiktok_statistics.total_following || 0),
							total_likes: Number(overview.tiktok_statistics.total_likes || 0),
							total_active_accounts: Number(overview.tiktok_statistics.total_active_accounts || 0),
							total_inactive_accounts: Number(overview.tiktok_statistics.total_inactive_accounts || 0),
						});
					}

					if (Array.isArray(overview.recent_jobs)) {
						setRecentJobs(overview.recent_jobs);
					}

					if (overview.growth_trends) {
						setGrowthTrends(overview.growth_trends);
					}
				}

				setLastUpdated(new Date().toLocaleTimeString('en-US'));
			} catch (err: any) {
				setError(err?.message || 'Failed to load dashboard statistics.');
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[selectedPeriod],
	);

	const handlePeriodChange = async (days: number) => {
		setSelectedPeriod(days);
		setGrowthLoading(true);
		try {
			const res = await getGrowthTrends(days);
			if (res?.data) {
				setGrowthTrends(res.data);
			}
		} catch {
			// graceful fallback
		} finally {
			setGrowthLoading(false);
		}
	};

	useEffect(() => {
		loadDashboardData();
	}, [loadDashboardData]);

	const totalProcessed = (crawlerStats?.total_success_accounts ?? 0) + (crawlerStats?.total_failed_accounts ?? 0);
	const accountSuccessRate = totalProcessed > 0 ? Math.round(((crawlerStats?.total_success_accounts ?? 0) / totalProcessed) * 100) : 0;
	const totalTiktok = tiktokStats?.total_accounts ?? 0;
	const activeAccountRate = totalTiktok > 0 ? Math.round(((tiktokStats?.total_active_accounts ?? 0) / totalTiktok) * 100) : 0;

	return {
		crawlerStats,
		tiktokStats,
		recentJobs,
		growthTrends,
		selectedPeriod,
		growthLoading,
		loading,
		refreshing,
		error,
		setError,
		lastUpdated,
		accountSuccessRate,
		activeAccountRate,
		loadDashboardData,
		handlePeriodChange,
	};
}
