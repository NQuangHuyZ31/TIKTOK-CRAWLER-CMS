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

export interface CreatePermissionPayload {
    module: string;
    action: string;
    name?: string;
    slug?: string;
    description?: string;
}

export interface CreateModulePermissionsPayload {
    module: string;
    name?: string;
    actions: string[];
    description?: string;
}

const baseURL = '/permission/permission';

/**
 * Fetch all permissions list with pagination, search, and filtering.
 * API: GET /permission/permission
 * Example: getPermissions({ module: 'crawler', page: 1, per_page: 15 })
 */
export const getPermissions = (params: Record<string, any> = {}) =>
    api<{ status: string; data: PermissionItem[]; meta?: any }>(baseURL, { params });

/**
 * Fetch permissions grouped by module.
 * API: GET /permission/permission/modules
 * Example: getGroupedPermissions()
 */
export const getGroupedPermissions = () =>
    api<{ status: string; data: Record<string, PermissionItem[]> }>(`${baseURL}/modules`);

/**
 * Fetch unique module names.
 * API: GET /permission/permission/distinct-modules
 * Example: getDistinctModules()
 */
export const getDistinctModules = () =>
    api<{ status: string; data: string[] }>(`${baseURL}/distinct-modules`);

/**
 * Create a single permission.
 * API: POST /permission/permission
 * Example: createPermission({ module: 'crawler', action: 'export', name: 'Export Crawl Data' })
 */
export const createPermission = (data: CreatePermissionPayload) =>
    api<{ status: string; data: PermissionItem }>(baseURL, { method: 'POST', data });

/**
 * Create standard basic permissions for a module (view, create, edit, delete).
 * API: POST /permission/permission/create-module
 * Example: createModulePermissions({ module: 'report', name: 'Reports', actions: ['view', 'create', 'edit', 'delete'] })
 */
export const createModulePermissions = (data: CreateModulePermissionsPayload) =>
    api<{ status: string; data: PermissionItem[] }>(`${baseURL}/create-module`, { method: 'POST', data });

/**
 * Delete a permission by ID.
 * API: DELETE /permission/permission/{id}
 * Example: deletePermission(5)
 */
export const deletePermission = (id: number | string) =>
    api<{ status: string; message: string }>(`${baseURL}/${id}`, { method: 'DELETE' });

const permissionAPI = {
    getPermissions,
    getGroupedPermissions,
    getDistinctModules,
    createPermission,
    createModulePermissions,
    deletePermission,
};

export default permissionAPI;
