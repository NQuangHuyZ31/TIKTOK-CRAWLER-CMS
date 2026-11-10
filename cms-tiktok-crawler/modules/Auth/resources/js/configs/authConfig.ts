/**
 * Auth module storage keys and configuration constants.
 */
export const AUTH_STORAGE_KEYS = {
    TOKEN: 'cms_tiktok_token',
} as const;

export const AUTH_ROUTES = {
    LOGIN: '/auth/login',
    RESET_PASSWORD: '/auth/login?reset-password=1',
    DEFAULT_REDIRECT: '/admin/dashboard',
} as const;

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    status: 'active' | 'inactive' | 'blocked';
    roles: string[];
    permissions: string[];
    module_permissions: {
        [key: string]: {
            view: boolean;
            edit: boolean;
            delete: boolean;
            create: boolean;
        };
    };
}
