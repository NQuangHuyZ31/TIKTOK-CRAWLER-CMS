import type { SelectOption } from '@core/configs/systemOptions';

// -----------------------------------------------------------------------------
// SYSTEM ACTIVITY & AUDIT LOG CONFIGURATION
// -----------------------------------------------------------------------------
export const ACTIVITY_ACTION_CONFIG: Record<string, { label: string; color: string }> = {
	CREATE: { label: 'CREATE', color: 'green' },
	UPDATE: { label: 'UPDATE', color: 'blue' },
	DELETE: { label: 'DELETE', color: 'red' },
	LOGIN: { label: 'LOGIN', color: 'cyan' },
	LOGOUT: { label: 'LOGOUT', color: 'default' },
	CRAWL: { label: 'CRAWL', color: 'purple' },
	RETRY_CRAWL: { label: 'RETRY CRAWL', color: 'geekblue' },
	CRAWL_FAILED: { label: 'CRAWL FAILED', color: 'volcano' },
	PERMISSION_CHANGE: { label: 'PERMISSION CHANGE', color: 'gold' },
	ROLE_CHANGE: { label: 'ROLE CHANGE', color: 'magenta' },
};

export function getActivityActionConfig(action: string): { label: string; color: string } {
	const act = (action || '').toUpperCase();
	return (
		ACTIVITY_ACTION_CONFIG[act] || {
			label: action || 'UNKNOWN',
			color: 'default',
		}
	);
}

export const ACTIVITY_ACTION_OPTIONS: SelectOption[] = [
	{ label: 'All Actions', value: '' },
	{ label: 'LOGIN', value: 'LOGIN' },
	{ label: 'LOGOUT', value: 'LOGOUT' },
	{ label: 'CREATE', value: 'CREATE' },
	{ label: 'UPDATE', value: 'UPDATE' },
	{ label: 'DELETE', value: 'DELETE' },
	{ label: 'CRAWL', value: 'CRAWL' },
	{ label: 'RETRY CRAWL', value: 'RETRY_CRAWL' },
	{ label: 'PERMISSION CHANGE', value: 'PERMISSION_CHANGE' },
	{ label: 'ROLE CHANGE', value: 'ROLE_CHANGE' },
];

export const ACTIVITY_MODULE_OPTIONS: SelectOption[] = [
	{ label: 'All Modules', value: '' },
	{ label: 'TIKTOK', value: 'TIKTOK' },
	{ label: 'CRAWLER', value: 'CRAWLER' },
	{ label: 'USER MANAGEMENT', value: 'USER_MANAGEMENT' },
	{ label: 'ROLE', value: 'ROLE' },
	{ label: 'PERMISSION', value: 'PERMISSION' },
	{ label: 'SYSTEM', value: 'SYSTEM' },
	{ label: 'AUTH', value: 'AUTH' },
];

export const ACTIVITY_STATUS_OPTIONS: SelectOption[] = [
	{ label: 'All Statuses', value: '' },
	{ label: 'SUCCESS', value: 'SUCCESS', color: 'success' },
	{ label: 'FAILED', value: 'FAILED', color: 'error' },
	{ label: 'TIMEOUT', value: 'TIMEOUT', color: 'warning' },
];

export const LOGIN_STATUS_OPTIONS: SelectOption[] = [
	{ label: 'All Statuses', value: '' },
	{ label: 'Success', value: 'success' },
	{ label: 'Failed', value: 'failed' },
];
