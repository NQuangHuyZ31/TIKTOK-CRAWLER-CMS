export interface SettingTabDef {
    key: string;
    label: string;
    description: string;
}

export const SETTING_TABS: SettingTabDef[] = [
    {
        key: 'general',
        label: 'General Settings',
        description: 'Basic platform branding, display timezone, and administrative contact parameters.',
    },
    {
        key: 'crawler',
        label: 'Crawler Engine',
        description: 'Automated crawler worker endpoints, concurrency limits, and retry policies.',
    },
    {
        key: 'security',
        label: 'Security & Access',
        description: 'Session lifetime, authentication policies, and brute-force defenses.',
    },
    {
        key: 'info',
        label: 'System Diagnostics',
        description: 'Live runtime environment metrics, PHP/Laravel versions, and memory usage.',
    },
];
