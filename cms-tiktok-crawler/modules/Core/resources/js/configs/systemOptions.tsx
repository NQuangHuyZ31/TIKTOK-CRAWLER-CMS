import React from 'react';
import {
	AppstoreOutlined,
	BarChartOutlined,
	DatabaseOutlined,
	FileTextOutlined,
	FolderOutlined,
	GlobalOutlined,
	KeyOutlined,
	RobotOutlined,
	SafetyCertificateOutlined,
	SettingOutlined,
	TagOutlined,
	TeamOutlined,
	VideoCameraOutlined,
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

export interface SidebarIconOption {
	value: string;
	label: string;
	icon: React.ReactNode;
}

export const SIDEBAR_ICON_OPTIONS: SidebarIconOption[] = [
	{ value: 'AppstoreOutlined', label: 'Appstore', icon: <AppstoreOutlined /> },
	{ value: 'FileTextOutlined', label: 'Document / Report', icon: <FileTextOutlined /> },
	{ value: 'BarChartOutlined', label: 'Analytics / Chart', icon: <BarChartOutlined /> },
	{ value: 'FolderOutlined', label: 'Folder', icon: <FolderOutlined /> },
	{ value: 'DatabaseOutlined', label: 'Database', icon: <DatabaseOutlined /> },
	{ value: 'TeamOutlined', label: 'Users / Team', icon: <TeamOutlined /> },
	{ value: 'GlobalOutlined', label: 'Global / Web', icon: <GlobalOutlined /> },
	{ value: 'TagOutlined', label: 'Tag / Category', icon: <TagOutlined /> },
	{ value: 'SettingOutlined', label: 'Settings', icon: <SettingOutlined /> },
	{ value: 'RobotOutlined', label: 'Robot / Crawler', icon: <RobotOutlined /> },
	{ value: 'VideoCameraOutlined', label: 'Video / Media', icon: <VideoCameraOutlined /> },
	{ value: 'SafetyCertificateOutlined', label: 'Security / Role', icon: <SafetyCertificateOutlined /> },
	{ value: 'KeyOutlined', label: 'Key / Permission', icon: <KeyOutlined /> },
];

// -----------------------------------------------------------------------------
// GLOBAL STATUS TAG COLORS & LABELS
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
