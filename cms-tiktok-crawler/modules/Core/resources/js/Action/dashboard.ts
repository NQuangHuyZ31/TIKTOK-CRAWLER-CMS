import { api } from './api';
import type { CrawlerStatistics, TiktokStatistics, CrawlJobItem, DashboardGrowthTrends } from '../pages/ui/types';

export interface DashboardOverviewData {
    crawler_statistics: CrawlerStatistics;
    tiktok_statistics: TiktokStatistics;
    recent_jobs: CrawlJobItem[];
    growth_trends?: DashboardGrowthTrends;
}

export interface DashboardOverviewResponse {
    status: string;
    message?: string;
    data: DashboardOverviewData;
}

export interface DashboardGrowthResponse {
    status: string;
    message?: string;
    data: DashboardGrowthTrends;
}

/**
 * Fetch dedicated aggregate dashboard overview data.
 * API: GET /core/dashboard?days=30
 * Protected by core.view permission.
 */
export const getDashboardOverview = (days: number = 30) =>
    api<DashboardOverviewResponse>(`/core/dashboard?days=${days}`);

/**
 * Fetch isolated growth trends for Followers and Likes charts.
 * API: GET /core/dashboard/growth?days=30
 */
export const getGrowthTrends = (days: number = 30) =>
    api<DashboardGrowthResponse>(`/core/dashboard/growth?days=${days}`);

export default {
    getDashboardOverview,
    getGrowthTrends,
};
