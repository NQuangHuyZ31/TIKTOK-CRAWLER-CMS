import { api } from '@core/Action/api';
import type { PermissionItem } from '@modules/Permission/resources/js/Action/permission';

export type { PermissionItem };

export interface RoleItem {
    id: number;
    name: string;
    slug: string;
    description?: string;
    permissions_count?: number;
    users_count?: number;
    permissions?: PermissionItem[];
    permission_ids?: number[];
    permission_slugs?: string[];
    created_at?: string;
    updated_at?: string;
}

const baseURL = '/role/role';

/**
 * Fetch paginated list of roles with optional search query.
 * API: GET /role/role
 * Example: getRoles({ page: 1, per_page: 10, search: 'admin' })
 */
export const getRoles = (params: Record<string, any> = {}) =>
    api<{ status: string; data: RoleItem[]; meta?: any }>(baseURL, { params });

/**
 * Fetch single role detail by ID with associated permissions.
 * API: GET /role/role/{id}
 * Example: getRoleById(1)
 */
export const getRoleById = (id: string | number) =>
    api<{ status: string; data: RoleItem }>(`${baseURL}/${id}`);

/**
 * Create a new system role.
 * API: POST /role/role
 * Example: createRole({ name: 'Editor', slug: 'editor', permissions: [1, 2] })
 */
export const createRole = (data: { name: string; slug?: string; description?: string; permissions?: (number | string)[] }) =>
    api<{ status: string; data: RoleItem }>(baseURL, { method: 'POST', data });

/**
 * Update an existing system role.
 * API: PUT /role/role/{id}
 * Example: updateRole(1, { name: 'Super Admin', permissions: [1, 2, 3] })
 */
export const updateRole = (id: string | number, data: { name: string; slug?: string; description?: string; permissions?: (number | string)[] }) =>
    api<{ status: string; data: RoleItem }>(`${baseURL}/${id}`, { method: 'PUT', data });

/**
 * Delete a role by ID.
 * API: DELETE /role/role/{id}
 * Example: deleteRole(2)
 */
export const deleteRole = (id: string | number) =>
    api<{ status: string; message: string }>(`${baseURL}/${id}`, { method: 'DELETE' });

/**
 * Fetch available system permissions grouped by module.
 * API: GET /role/role/permissions
 * Example: getAvailablePermissions()
 */
export const getAvailablePermissions = () =>
    api<{ status: string; data: Record<string, PermissionItem[]> }>(`${baseURL}/permissions`);
