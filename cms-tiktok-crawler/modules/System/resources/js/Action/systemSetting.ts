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

export interface SettingItem {
    id: number;
    key: string;
    group: string;
    value: any;
    formatted_value: any;
    type: string;
    description?: string;
    is_public: boolean;
}

/**
 * Fetch all system settings list.
 * API: GET /system/system-setting
 * Example: getSettings({ group: 'general' })
 */
export const getSettings = (params: Record<string, any> = {}) =>
    api<{ status: string; data: SettingItem[] }>('/system/system-setting', { params });

/**
 * Fetch all system settings organized by group key-values.
 * API: GET /system/system-setting?grouped=true
 * Example: getGroupedSettings()
 */
export const getGroupedSettings = () =>
    api<{ status: string; data: Record<string, Record<string, any>> }>('/system/system-setting', {
        params: { grouped: true },
    });

/**
 * Fetch settings for a specific group.
 * API: GET /system/system-setting/group/{group}
 * Example: getSettingsByGroup('crawler')
 */
export const getSettingsByGroup = (group: string) =>
    api<{ status: string; data: Record<string, any> }>(`/system/system-setting/group/${group}`);

/**
 * Batch update multiple settings by key-value pairs.
 * API: POST /system/system-setting/batch-update
 * Example: batchUpdateSettings({ site_name: 'My CMS', maintenance_mode: false }, 'general')
 */
export const batchUpdateSettings = (settings: Record<string, any>, group: string = 'general') =>
    api<{ status: string; data: Record<string, Record<string, any>> }>('/system/system-setting/batch-update', {
        method: 'POST',
        data: { settings, group },
    });

/**
 * Fetch runtime system information and environment metrics.
 * API: GET /system/system-setting/info
 * Example: getSystemInfo()
 */
export const getSystemInfo = () =>
    api<{ status: string; data: SystemInfoData }>('/system/system-setting/info');
