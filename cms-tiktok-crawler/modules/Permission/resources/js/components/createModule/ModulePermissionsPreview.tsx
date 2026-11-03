import React from 'react';
import { Typography } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface ModulePermissionsPreviewProps {
	watchedModule?: string;
	watchedActions?: string[];
}

export default function ModulePermissionsPreview({ watchedModule, watchedActions = [] }: ModulePermissionsPreviewProps) {
	if (!watchedModule || watchedActions.length === 0) return null;

	const cleanModule = watchedModule.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');

	return (
		<div
			style={{
				background: '#fafafa',
				padding: '12px 16px',
				borderRadius: 6,
				border: '1px solid #f0f0f0',
			}}
		>
			<Text type="secondary" style={{ fontSize: 12 }}>
				Permissions to be created:
			</Text>
			<div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
				{watchedActions.map((act: string) => (
					<span
						key={act}
						style={{
							background: '#e6f4ff',
							color: '#0958d9',
							padding: '2px 8px',
							borderRadius: 4,
							fontFamily: 'monospace',
							fontSize: 12,
						}}
					>
						<CheckOutlined style={{ marginRight: 4, fontSize: 10 }} />
						{cleanModule}.{act}
					</span>
				))}
			</div>
		</div>
	);
}
