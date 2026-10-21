import React from 'react';
import { Tag } from 'antd';

export type StatusType = 'pending' | 'in_progress' | 'running' | 'completed' | 'success' | 'failed' | 'inactive' | 'active' | string;

const statusConfig: Record<string, { color: string; label?: string }> = {
	pending: { color: 'default', label: 'Pending' },
	in_progress: { color: 'processing', label: 'In Progress' },
	running: { color: 'processing', label: 'Running' },
	completed: { color: 'success', label: 'Completed' },
	success: { color: 'success', label: 'Success' },
	failed: { color: 'error', label: 'Failed' },
	inactive: { color: 'default', label: 'Inactive' },
	active: { color: 'success', label: 'Active' },
};

export interface StatusTagProps {
	status?: StatusType | null;
	label?: string;
	style?: React.CSSProperties;
}

export default function StatusTag({ status, label, style }: StatusTagProps) {
	const value = String(status || 'unknown').toLowerCase();
	const config = statusConfig[value] || { color: 'default', label: status || 'Unknown' };
	const displayLabel = label ?? config.label ?? status;

	return (
		<Tag
			color={config.color}
			style={{
				textTransform: 'capitalize',
				borderRadius: 4,
				fontWeight: 500,
				...style,
			}}
		>
			{displayLabel}
		</Tag>
	);
}
