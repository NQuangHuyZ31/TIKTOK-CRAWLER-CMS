import { api } from '@core/Action/api';
import type { UserProfile } from '../configs/authConfig';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponseData {
    token: string;
    token_type: string;
    user: UserProfile;
}

export interface ResetPasswordPayload {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}

/**
 * Authenticate user with credentials and issue Bearer token.
 * API: POST /auth/login
 */
export const login = (data: LoginPayload) =>
    api<{ status: string; data: LoginResponseData; message: string }>('/auth/login', {
        method: 'POST',
        data,
    });

/**
 * Revoke the current access token and log out the user.
 * API: POST /auth/logout
 */
export const logout = () =>
    api<{ status: string; message: string }>('/auth/logout', {
        method: 'POST',
    });

/**
 * Fetch authenticated user profile with roles and module permissions matrix.
 * API: GET /auth/me
 */
export const getMe = () =>
    api<{ status: string; data: UserProfile; message: string }>('/auth/me');


/**
 * Reset account password with token.
 * API: POST /auth/reset-password
 */
export const resetPassword = (data: ResetPasswordPayload) =>
    api<{ status: string; message: string }>('/auth/reset-password', {
        method: 'POST',
        data,
    });

export interface LoginLogItem {
    id: number;
    user_id?: number | null;
    email: string;
    ip_address?: string | null;
    user_agent?: string | null;
    device?: string | null;
    status: 'success' | 'failed';
    failure_reason?: string | null;
    created_at: string;
    user?: { id: number; name: string; email: string };
}

/**
 * Retrieve paginated login activity logs.
 * API: GET /auth/login-logs
 */
export const getLoginLogs = (params: Record<string, any> = {}) =>
    api<{
        status: string;
        data: {
            data: LoginLogItem[];
            total: number;
            current_page: number;
            per_page: number;
            last_page: number;
        };
        message: string;
    }>('/auth/login-logs', { params });

