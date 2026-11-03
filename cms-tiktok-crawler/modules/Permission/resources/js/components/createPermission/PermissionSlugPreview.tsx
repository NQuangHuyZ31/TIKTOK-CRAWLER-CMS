import React from 'react';
import { Space, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface PermissionSlugPreviewProps {
	watchedModule?: string;
	watchedAction?: string;
}

export default function PermissionSlugPreview({ watchedModule, watchedAction }: PermissionSlugPreviewProps) {
	if (!watchedModule || !watchedAction) return null;

	const cleanModule = watchedModule.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
	const cleanAction = watchedAction.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');

	return (
		<div
			style={{
				background: '#fafafa',
				padding: '10px 14px',
				borderRadius: 6,
				border: '1px solid #f0f0f0',
			}}
		>
			<Space>
				<CheckCircleOutlined style={{ color: '#52c41a' }} />
				<Text type="secondary" style={{ fontSize: 13 }}>
					Preview Slug:{' '}
					<Text code strong>
						{cleanModule}.{cleanAction}
					</Text>
				</Text>
			</Space>
		</div>
	);
}
