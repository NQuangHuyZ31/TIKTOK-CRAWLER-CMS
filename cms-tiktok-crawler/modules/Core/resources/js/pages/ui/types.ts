/**
 * Dashboard KPI and Model Types
 */
export interface CrawlerStatistics {
	total_jobs: number;
	total_accounts: number;
	total_success_accounts: number;
	total_failed_accounts: number;
	total_completed_jobs: number;
	total_failed_jobs: number;
}

export interface TiktokStatistics {
	total_accounts: number;
	total_followers: number;
	total_following: number;
	total_likes: number;
	total_active_accounts: number;
	total_inactive_accounts: number;
}

export interface CrawlJobItem {
	id: number;
	source_type: string;
	total_accounts: number;
	success_count: number;
	failed_count: number;
	status: string;
	created_at: string;
	started_at?: string;
	completed_at?: string;
}
