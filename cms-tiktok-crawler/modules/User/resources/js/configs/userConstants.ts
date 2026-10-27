export interface RoleBadgeConfig {
    name: string;
    color: string;
    bg: string;
    border: string;
    description?: string;
}

export const ROLE_CONFIGS: Record<string, RoleBadgeConfig> = {
    admin: {
        name: 'Super Administrator',
        color: '#722ed1',
        bg: '#f9f0ff',
        border: '#d3adf7',
        description: 'Full administrative access across all modules and system settings.',
    },
    manager: {
        name: 'Operations Manager',
        color: '#1677ff',
        bg: '#e6f4ff',
        border: '#91caff',
        description: 'Manage users, assign roles, and supervise operational crawler tasks.',
    },
    editor: {
        name: 'Crawler Specialist',
        color: '#13c2c2',
        bg: '#e6fffb',
        border: '#87e8de',
        description: 'Create and run crawlers, manage TikTok accounts and extract datasets.',
    },
    viewer: {
        name: 'Data Viewer',
        color: '#595959',
        bg: '#f5f5f5',
        border: '#d9d9d9',
        description: 'Read-only access to crawler dashboards and generated reports.',
    },
};

export const STATUS_CONFIGS: Record<string, { label: string; color: string; badgeColor: string }> = {
    active: {
        label: 'Active',
        color: 'success',
        badgeColor: '#52c41a',
    },
    inactive: {
        label: 'Inactive',
        color: 'warning',
        badgeColor: '#faad14',
    },
    blocked: {
        label: 'Blocked',
        color: 'error',
        badgeColor: '#ff4d4f',
    },
};
