import { api } from './api';
import type { CrawlerStatistics, TiktokStatistics, CrawlJobItem } from '../pages/ui/types';

export interface DashboardOverviewData {
    crawler_statistics: CrawlerStatistics;
    tiktok_statistics: TiktokStatistics;
    recent_jobs: CrawlJobItem[];
}

export interface DashboardOverviewResponse {
    status: string;
    message?: string;
    data: DashboardOverviewData;
}

/**
 * Fetch dedicated aggregate dashboard overview data.
 * API: GET /core/dashboard
 * Protected by core.view permission.
 */
export const getDashboardOverview = () =>
    api<DashboardOverviewResponse>('/core/dashboard');

export default {
    getDashboardOverview,
};
