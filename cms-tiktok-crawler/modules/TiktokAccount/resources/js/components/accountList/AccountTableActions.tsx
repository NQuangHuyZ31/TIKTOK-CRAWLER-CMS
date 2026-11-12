import React from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PermissionGate from '@core/components/PermissionGate';
import type { TiktokAccountItem } from '../../Action/tiktokAccount';

export interface AccountTableActionsProps {
	record: TiktokAccountItem;
	onDelete: (id: number | string) => void;
}

export default function AccountTableActions({ record, onDelete }: AccountTableActionsProps) {
	return (
		<Space size={4}>
			<PermissionGate module="tiktok_account" action="view">
				<Tooltip title="View Detail">
					<Link to={`/tiktok-account/${record.id}`}>
						<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#EC008C' }} />} />
					</Link>
				</Tooltip>
			</PermissionGate>

			<PermissionGate module="tiktok_account" action="edit">
				<Tooltip title="Edit Account">
					<Link to={`/tiktok-account/${record.id}/edit`}>
						<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
					</Link>
				</Tooltip>
			</PermissionGate>

			<PermissionGate module="tiktok_account" action="delete">
				<Popconfirm
					title="Delete TikTok account"
					description="Are you sure you want to delete this account?"
					onConfirm={() => onDelete(record.id)}
					okText="Delete"
					cancelText="Cancel"
					okButtonProps={{ danger: true }}
				>
					<Tooltip title="Delete Account">
						<Button type="text" danger size="small" icon={<DeleteOutlined />} />
					</Tooltip>
				</Popconfirm>
			</PermissionGate>
		</Space>
	);
}
