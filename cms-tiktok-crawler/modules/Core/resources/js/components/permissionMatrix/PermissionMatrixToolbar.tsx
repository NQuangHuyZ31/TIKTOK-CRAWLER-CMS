import React from 'react';
import { Checkbox, Space, Tag, Typography } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface PermissionMatrixToolbarProps {
	title: string;
	isAdmin?: boolean;
	selectedCount: number;
	totalCount: number;
	disabled?: boolean;
	isIndeterminate: boolean;
	isAllSelected: boolean;
	onSelectAll: (checked: boolean) => void;
}

export default function PermissionMatrixToolbar({
	title,
	isAdmin = false,
	selectedCount,
	totalCount,
	disabled = false,
	isIndeterminate,
	isAllSelected,
	onSelectAll,
}: PermissionMatrixToolbarProps) {
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'space-between',
				alignItems: 'center',
				gap: 12,
				marginBottom: 12,
				padding: '10px 14px',
				background: '#f8fafc',
				borderRadius: 8,
				border: '1px solid #e2e8f0',
			}}
		>
			<Space wrap>
				<CheckSquareOutlined style={{ color: '#1677ff', fontSize: 16 }} />
				<Text strong style={{ fontSize: 14 }}>
					{title}
				</Text>
				{isAdmin ? (
					<Tag color="gold">Super Admin (All Privileges)</Tag>
				) : (
					<Tag color="geekblue">
						{selectedCount} / {totalCount} Selected
					</Tag>
				)}
			</Space>

			<Space wrap>
				{!disabled && !isAdmin && (
					<Checkbox indeterminate={isIndeterminate} checked={isAllSelected} onChange={(e) => onSelectAll(e.target.checked)}>
						Select All Permissions
					</Checkbox>
				)}
			</Space>
		</div>
	);
}
