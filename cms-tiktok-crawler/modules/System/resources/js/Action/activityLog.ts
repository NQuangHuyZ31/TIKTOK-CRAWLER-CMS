import { api } from '@core/Action/api';

export interface ActivityLogItem {
	id: number;
	user_id: number | null;
	user_email: string;
	user_role: string | null;
	action: string;
	module: string;
	record_id: string | null;
	record_type: string | null;
	old_data: Record<string, any> | null;
	new_data: Record<string, any> | null;
	metadata: Record<string, any> | null;
	status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | string;
	error_message: string | null;
	created_at: string;
}

export interface ActivityStatistics {
	total_activities: number;
	success_activities: number;
	failed_activities: number;
	today_activities: number;
}

export interface PaginationMeta {
	current_page: number;
	per_page: number;
	total: number;
	last_page: number;
}

export interface ActivityLogListResponse {
	status: string;
	message?: string;
	data: ActivityLogItem[];
	meta: PaginationMeta;
}

export const getActivityLogs = (params: Record<string, any> = {}) =>
	api<ActivityLogListResponse>('/system/activity-log', { params });

export const getActivityLog = (id: number | string) =>
	api<{ status: string; data: ActivityLogItem }>(`/system/activity-log/${id}`);

export const getActivityStatistics = () =>
	api<{ status: string; data: ActivityStatistics }>('/system/activity-log/statistics');
