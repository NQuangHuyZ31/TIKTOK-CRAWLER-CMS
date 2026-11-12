import React from 'react';
import { Space, Tag, Typography } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import TableComponent from '@core/components/Table';
import { permissionTableColumns } from '../configs/permissionTableConfig';
import type { PermissionItem } from '../Action/permission';

const { Text } = Typography;

export interface PermissionTableListProps {
	data: PermissionItem[];
	loading?: boolean;
	pagination?: any;
	onPageChange?: (page: number, pageSize: number) => void;
	onDelete: (permission: PermissionItem) => void;
}

const ACTION_COLOR_MAP: Record<string, string> = {
	view: 'blue',
	create: 'green',
	edit: 'orange',
	delete: 'red',
	export: 'purple',
	import: 'cyan',
	approve: 'gold',
	assign: 'geekblue',
	manage: 'magenta',
};

const MODULE_COLOR_MAP: Record<string, string> = {
	user: 'blue',
	role: 'purple',
	permission: 'cyan',
	crawler: 'orange',
	system: 'geekblue',
	report: 'green',
};

export default function PermissionTableList({ data, loading = false, pagination, onPageChange, onDelete }: PermissionTableListProps) {
	const renderColumns = {
		name: (val: string) => (
			<Space size={6}>
				<KeyOutlined style={{ color: '#EC008C', fontSize: 13 }} />
				<Text strong>{val || '-'}</Text>
			</Space>
		),
		slug: (val: string) => (
			<Tag color="default" style={{ fontFamily: 'monospace', fontSize: 12 }}>
				{val}
			</Tag>
		),
		module: (val: string) => {
			const color = MODULE_COLOR_MAP[val?.toLowerCase()] || 'geekblue';
			return (
				<Tag color={color} style={{ fontWeight: 500, textTransform: 'capitalize' }}>
					{val}
				</Tag>
			);
		},
		action: (val: string) => {
			const color = ACTION_COLOR_MAP[val?.toLowerCase()] || 'default';
			return (
				<Tag color={color} style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
					{val}
				</Tag>
			);
		},
		created_at: (val: string) => (
			<Text type="secondary" style={{ fontSize: 12 }}>
				{val ? new Date(val).toLocaleDateString() : '-'}
			</Text>
		),
	};

	return (
		<TableComponent
			columns={permissionTableColumns}
			data={data}
			loading={loading}
			pagination={pagination}
			onPageChange={onPageChange}
			renderColumns={renderColumns}
			onDelete={onDelete}
			deleteConfirmTitle={(record) => (
				<div style={{ maxWidth: 240 }}>
					Are you sure you want to delete permission <strong>{record.slug}</strong>?
				</div>
			)}
			permissionModule="permission"
			rowKey="id"
		/>
	);
}
