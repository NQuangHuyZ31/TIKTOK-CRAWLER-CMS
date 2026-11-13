import { api } from '@core/Action/api';

export interface CleanupHistoryItem {
	id: string;
	executed_at: string;
	trigger: string;
	status: 'success' | 'failed' | 'running';
	purged_count: number;
	activity_logs_purged: number;
	login_logs_purged: number;
	duration_sec: number;
	error_message: string | null;
}

export interface WorkerSettings {
	auto_cleanup_enabled: boolean;
	cleanup_schedule_preset: string;
	cleanup_schedule_cron: string;
	activity_log_retention_days: number;
	login_log_retention_days: number;
	cleanup_chunk_size: number;
	cleanup_sleep_between_batches_ms: number;
	last_cleanup_at: string | null;
	last_cleanup_purged_count: number;
	last_cleanup_duration_sec: string;
	last_cleanup_status: string;
	last_cleanup_history: CleanupHistoryItem[];
}

export interface CleanupResult {
	activity_logs_purged: number;
	login_logs_purged: number;
	total_purged: number;
	duration_sec: number;
}

export const getSystemSettings = <T = WorkerSettings>(group: string = 'worker') =>
	api<{ status: string; data: { group: string; settings: T } }>(
		'/system/system-setting',
		{ params: { group } }
	);

export const updateSystemSettings = (settings: Record<string, any>, group: string = 'worker') =>
	api<{ status: string; data: { group: string; settings: Record<string, any> } }>(
		'/system/system-setting/update-settings',
		{
			method: 'POST',
			data: { group, settings },
		}
	);

export const runLogCleanup = (params: { activity_days?: number; login_days?: number } = {}) =>
	api<{ status: string; message: string; data: CleanupResult }>(
		'/system/system-setting/run-cleanup',
		{
			method: 'POST',
			data: params,
		}
	);

export const getCleanupHistory = () =>
	api<{ status: string; data: CleanupHistoryItem[] }>(
		'/system/system-setting/history'
	);
