import { api } from '@core/Action/api';

export interface SystemInfoData {
	app_name: string;
	app_env: string;
	app_debug: boolean;
	app_url: string;
	php_version: string;
	laravel_version: string;
	database_driver: string;
	database_connected: boolean;
	server_os: string;
	server_time: string;
	timezone: string;
	memory_usage_mb: number;
	memory_limit: string;
	max_execution_time: string;
}

export const getSystemDiagnostic = () =>
	api<{ status: string; data: SystemInfoData }>('/system/system-diagnostic');
