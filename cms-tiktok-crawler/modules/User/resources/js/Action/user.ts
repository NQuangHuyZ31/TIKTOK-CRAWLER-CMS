import { api } from '@core/Action/api';

const baseURL = '/user/user';

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
    auth_type?: 'password' | 'google';
    google_id?: string | null;
    email_verified_at?: string;
    google2fa_enabled: boolean;
    is_admin: boolean;
    permission_type?: 'role' | 'user';
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
 */
export const getUsers = (params: Record<string, any> = {}) =>
    api(`${baseURL}`, { params });

/**
 * Fetch user details by ID.
 */
export const getUserById = (id: number | string) =>
    api(`${baseURL}/${id}`);

/**
 * Create a new user with assigned roles and direct permissions.
 */
export const createUser = (data: Record<string, any>) =>
    api(`${baseURL}`, { method: 'POST', data });

/**
 * Update an existing user with role and permission assignments.
 */
export const updateUser = (id: number | string, data: Record<string, any>) =>
    api(`${baseURL}/${id}`, { method: 'PUT', data });

/**
 * Delete a user account.
 */
export const deleteUser = (id: number | string) =>
    api(`${baseURL}/${id}`, { method: 'DELETE' });

/**
 * Quick update of user status (active, inactive, blocked).
 */
export const updateUserStatus = (id: number | string, status: string) =>
    api(`${baseURL}/${id}/status`, { method: 'PATCH', data: { status } });

/**
 * Reset password for a user.
 */
export const resetPassword = (id: number | string) =>
    api(`${baseURL}/${id}/reset-password`, { method: 'POST' });

/**
 * Fetch aggregate KPI statistics for user management.
 */
export const getStatisticsSummary = () =>
    api(`${baseURL}/statistics-summary`);

/**
 * Fetch all system roles and permissions catalog for user assignment UI.
 */
export const getRolesAndPermissions = () =>
    api(`${baseURL}/roles-and-permissions`);

/**
 * Reset authentication for 2FA.
 */
export const resetAuthencation2FA = (email: string) =>
    api(`${baseURL}/reset-authentication`, { method: 'PUT', data: { email } });

const userAPI = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetPassword,
    resetAuthencation2FA,
    getStatisticsSummary,
    getRolesAndPermissions,
};

export default userAPI;
