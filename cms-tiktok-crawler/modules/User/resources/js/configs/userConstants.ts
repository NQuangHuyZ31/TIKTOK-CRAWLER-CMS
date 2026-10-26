export interface RoleBadgeConfig {
    name: string;
    color: string;
    bg: string;
    border: string;
    description: string;
}

export const ROLE_CONFIGS: Record<string, RoleBadgeConfig> = {
    admin: {
        name: 'Super Administrator',
        color: '#722ed1',
        bg: '#f9f0ff',
        border: '#d3adf7',
        description: 'Unrestricted administrative access across all modules (Crawler, Accounts, Users, Core).',
    },
    manager: {
        name: 'Operations Manager',
        color: '#1677ff',
        bg: '#e6f4ff',
        border: '#91caff',
        description: 'Management access for crawlers and accounts (view/edit), plus view access to users.',
    },
    editor: {
        name: 'Crawler Specialist',
        color: '#13c2c2',
        bg: '#e6fffb',
        border: '#87e8de',
        description: 'Operational access to trigger and manage crawlers and TikTok account profiles.',
    },
    viewer: {
        name: 'Data Viewer',
        color: '#595959',
        bg: '#f5f5f5',
        border: '#d9d9d9',
        description: 'Read-only auditing access to view crawl jobs, TikTok accounts, and reports.',
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
