import React from 'react';
import { Tag } from 'antd';
import { GLOBAL_STATUS_CONFIG } from '../configs/systemOptions';

export type StatusType = string;

export interface StatusTagProps {
	status?: StatusType | null;
	label?: string;
	style?: React.CSSProperties;
}

export default function StatusTag({ status, label, style }: StatusTagProps) {
	const value = String(status || 'unknown').toLowerCase();
	const config = GLOBAL_STATUS_CONFIG[value] || { color: 'default', label: status || 'Unknown' };
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
