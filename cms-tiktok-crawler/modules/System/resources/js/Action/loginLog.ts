import { api } from '@core/Action/api';

export interface LoginLogItem {
	id: number;
	user_id: number | null;
	email: string;
	ip_address: string | null;
	user_agent: string | null;
	device: string | null;
	status: 'success' | 'failed' | string;
	failure_reason: string | null;
	created_at: string;
	updated_at?: string;
}

export interface PaginationMeta {
	current_page: number;
	per_page: number;
	total: number;
	last_page: number;
}

export interface LoginLogListResponse {
	status: string;
	message?: string;
	data: LoginLogItem[];
	meta: PaginationMeta;
}

export const getLoginLogs = (params: Record<string, any> = {}) =>
	api<LoginLogListResponse>('/system/login-log', { params });

export const getLoginLog = (id: number | string) =>
	api<{ status: string; data: LoginLogItem }>(`/system/login-log/${id}`);
