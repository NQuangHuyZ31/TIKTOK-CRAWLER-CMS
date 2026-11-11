import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}

const csrfToken = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

/**
 * Resolves API baseURL strictly from environment configuration (.env: VITE_API_URL).
 * Does not read from URL / meta tags / window.
 */
const getBaseUrl = (): string => {
    // 1. Webpack / Mix: process.env.VITE_API_URL (injected via DefinePlugin from .env)
    try {
        if (typeof process !== 'undefined' && process?.env?.VITE_API_URL) {
            return process.env.VITE_API_URL;
        }
    } catch {
        // Ignore
    }

    // 2. Vite: import.meta.env.VITE_API_URL (injected at build-time from .env)
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
        }
    } catch {
        // Ignore
    }

    return '';
};

export const http = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

http.interceptors.request.use((config) => {
    const token = csrfToken();
    if (token) {
        config.headers.set('X-CSRF-TOKEN', token);
    }

    // Attach Bearer token if stored by Auth module
    const authToken =
        localStorage.getItem('cms_tiktok_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('access_token');
    if (authToken && authToken !== 'undefined' && authToken !== 'null') {
        const cleanToken = authToken.startsWith('"') ? JSON.parse(authToken) : authToken;
        config.headers.set('Authorization', `Bearer ${cleanToken}`);
    } else if (authToken === 'undefined' || authToken === 'null') {
        localStorage.removeItem('cms_tiktok_token');
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
    }

    return config;
});

http.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
        if (error instanceof AxiosError) {
            const payload = (error.response?.data ?? {}) as { message?: string; errors?: Record<string, string[]> };
            const status = error.response?.status ?? 0;

            // Handle unauthorized access
            if (status === 401) {
                localStorage.removeItem('cms_tiktok_token');
                localStorage.removeItem('cms_tiktok_user');
                localStorage.removeItem('token');
                localStorage.removeItem('access_token');
            }

            const message =
                payload.message ??
                (status === 419 ? 'CSRF token mismatch. Please reload the page.' : error.message);
            return Promise.reject(new ApiError(status, message, payload.errors ?? {}));
        }
        return Promise.reject(error);
    }
);

/**
 * Auth token helpers for Auth module integration
 */
export const setAuthToken = (token: string): void => {
    localStorage.setItem('token', token);
};

export const getAuthToken = (): string | null => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token.startsWith('"') ? JSON.parse(token) : token;
};

export const clearAuthToken = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
};

export async function api<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    const response = await http<T>({ url, ...config });
    return response.data;
}

export default http;

