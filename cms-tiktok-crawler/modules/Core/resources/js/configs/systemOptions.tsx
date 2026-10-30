import React from 'react';
import {
	AppstoreOutlined,
	RobotOutlined,
	VideoCameraOutlined,
	SettingOutlined,
	UserOutlined,
	SafetyCertificateOutlined,
	KeyOutlined,
	LockOutlined,
	ApiOutlined,
} from '@ant-design/icons';

/**
 * Common Select / Dropdown Option interface for system-wide filters and forms.
 */
export interface SelectOption<T = string> {
	label: string;
	value: T;
	disabled?: boolean;
	color?: string;
	danger?: boolean;
	desc?: string;
}

export interface ModuleConfigItem {
	label: string;
	icon: React.ReactNode;
	color: string;
}

// -----------------------------------------------------------------------------
// 1. GLOBAL SYSTEM MODULE REGISTRY
// Centralized registry of all system modules, their human-readable labels, icons, and colors.
// When adding a new module to the CMS, register its metadata here.
// -----------------------------------------------------------------------------
export const SYSTEM_MODULES: Record<string, ModuleConfigItem> = {
	core: { label: 'Core / Dashboard', icon: <AppstoreOutlined />, color: 'blue' },
	crawler: { label: 'Crawler Engine', icon: <RobotOutlined />, color: 'purple' },
	tiktok_account: { label: 'TikTok Accounts', icon: <VideoCameraOutlined />, color: 'green' },
	system: { label: 'System Settings', icon: <SettingOutlined />, color: 'gold' },
	user: { label: 'User Management', icon: <UserOutlined />, color: 'cyan' },
	role: { label: 'Role Management', icon: <SafetyCertificateOutlined />, color: 'geekblue' },
	permission: { label: 'Permission Management', icon: <KeyOutlined />, color: 'magenta' },
	auth: { label: 'Authentication', icon: <LockOutlined />, color: 'orange' },
};

/**
 * Safely retrieve module metadata by module key.
 */
export function getModuleConfig(mod: string): ModuleConfigItem {
	const key = (mod || '').toLowerCase();
	if (SYSTEM_MODULES[key]) {
		return SYSTEM_MODULES[key];
	}
	const formattedLabel = mod
		.split(/[_-]/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
	return {
		label: formattedLabel,
		icon: <ApiOutlined />,
		color: 'blue',
	};
}

// -----------------------------------------------------------------------------
// 2. GLOBAL STATUS TAG COLORS & LABELS
// Shared dictionary used by Core StatusTag component for standardizing badge colors.
// -----------------------------------------------------------------------------
export const GLOBAL_STATUS_CONFIG: Record<string, { color: string; label?: string }> = {
	pending: { color: 'default', label: 'Pending' },
	queued: { color: 'gold', label: 'Queued' },
	in_progress: { color: 'processing', label: 'In Progress' },
	running: { color: 'processing', label: 'Running' },
	completed: { color: 'success', label: 'Completed' },
	success: { color: 'success', label: 'Success' },
	failed: { color: 'error', label: 'Failed' },
	inactive: { color: 'default', label: 'Inactive' },
	active: { color: 'success', label: 'Active' },
	blocked: { color: 'error', label: 'Blocked' },
	disabled: { color: 'default', label: 'Disabled' },
	banned: { color: 'error', label: 'Banned' },
	timeout: { color: 'warning', label: 'Timeout' },
};
