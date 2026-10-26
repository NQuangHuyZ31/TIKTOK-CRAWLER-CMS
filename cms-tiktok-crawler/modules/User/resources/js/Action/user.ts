import { api } from '@core/Action/api';

const baseURL = '/user/users';

export interface UserRole {
    id: number;
    name: string;
    slug: string;
    description?: string;
    permissions?: string[];
}

export interface UserPermission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description?: string;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    avatar_url?: string;
    status: 'active' | 'inactive' | 'blocked';
    email_verified_at?: string;
    is_admin: boolean;
    roles: UserRole[];
    role_slugs: string[];
    permissions: UserPermission[];
    all_permissions: string[];
    permissions_matrix: Record<string, { view: boolean; edit: boolean }>;
    created_at: string;
    updated_at: string;
}

export interface UserStatistics {
    total_users: number;
    active_users: number;
    inactive_users: number;
    blocked_users: number;
    admin_users: number;
    manager_users: number;
    editor_users: number;
    viewer_users: number;
}

export interface RolesAndPermissionsCatalog {
    roles: UserRole[];
    permissions: UserPermission[];
    grouped_permissions: Array<{
        module: string;
        items: UserPermission[];
    }>;
}

/**
 * Fetch all users with search, role/status filters, sorting, and pagination.
 * API: GET /user/users
 * Example: getUsers({ page: 1, per_page: 10, search: 'alex', status: 'active', role: 'manager' })
 */
export const getUsers = (params: Record<string, any> = {}) =>
    api(`${baseURL}`, { params });

/**
 * Fetch user details by ID.
 * API: GET /user/users/{id}
 * Example: getUserById(1)
 */
export const getUserById = (id: number | string) =>
    api(`${baseURL}/${id}`);

/**
 * Create a new user with assigned roles and direct permissions.
 * API: POST /user/users
 * Example: createUser({ name: 'Jane', email: 'jane@cms.com', password: 'password', roles: ['manager'] })
 */
export const createUser = (data: Record<string, any>) =>
    api(`${baseURL}`, { method: 'POST', data });

/**
 * Update an existing user with role and permission assignments.
 * API: PUT /user/users/{id}
 * Example: updateUser(1, { name: 'Jane Doe', status: 'active' })
 */
export const updateUser = (id: number | string, data: Record<string, any>) =>
    api(`${baseURL}/${id}`, { method: 'PUT', data });

/**
 * Delete a user account.
 * API: DELETE /user/users/{id}
 * Example: deleteUser(2)
 */
export const deleteUser = (id: number | string) =>
    api(`${baseURL}/${id}`, { method: 'DELETE' });

/**
 * Quick update of user status (active, inactive, blocked).
 * API: PATCH /user/users/{id}/status
 * Example: updateUserStatus(1, 'inactive')
 */
export const updateUserStatus = (id: number | string, status: string) =>
    api(`${baseURL}/${id}/status`, { method: 'PATCH', data: { status } });

/**
 * Fetch aggregate KPI statistics for user management.
 * API: GET /user/users/statistics-summary
 * Example: getStatisticsSummary()
 */
export const getStatisticsSummary = () =>
    api(`${baseURL}/statistics-summary`);

/**
 * Fetch all system roles and permissions catalog for user assignment UI.
 * API: GET /user/users/roles-and-permissions
 * Example: getRolesAndPermissions()
 */
export const getRolesAndPermissions = () =>
    api(`${baseURL}/roles-and-permissions`);

const userAPI = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    getStatisticsSummary,
    getRolesAndPermissions,
};

export default userAPI;
