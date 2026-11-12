import React from 'react';
import { Space, Typography, theme } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface PermissionSlugPreviewProps {
	watchedModule?: string;
	watchedAction?: string;
}

export default function PermissionSlugPreview({ watchedModule, watchedAction }: PermissionSlugPreviewProps) {
	const { token } = theme.useToken();

	if (!watchedModule || !watchedAction) return null;

	const cleanModule = watchedModule.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
	const cleanAction = watchedAction.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');

	return (
		<div
			style={{
				background: token.colorFillAlter,
				padding: '10px 14px',
				borderRadius: 6,
				border: `1px solid ${token.colorBorderSecondary}`,
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
