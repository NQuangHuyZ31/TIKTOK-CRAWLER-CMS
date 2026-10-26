import { api } from '@core/Action/api';

export interface PermissionItem {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
    created_at?: string;
}

/**
 * Fetch all available permissions list.
 * API: GET /permission/permission
 * Example: getPermissions({ module: 'crawler' })
 */
export const getPermissions = (params: Record<string, any> = {}) =>
    api<{ status: string; data: PermissionItem[] }>('/permission/permission', { params });

/**
 * Fetch permissions grouped by module.
 * API: GET /permission/permission/modules
 * Example: getGroupedPermissions()
 */
export const getGroupedPermissions = () =>
    api<{ status: string; data: Record<string, PermissionItem[]> }>('/permission/permission/modules');
