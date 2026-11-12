import React from 'react';
import { Space, Tag, Typography } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import TableComponent from '@core/components/Table';
import { roleTableColumns } from '../configs/roleTableConfig';
import type { RoleItem } from '../Action/role';

const { Text } = Typography;

export interface RoleTableListProps {
	data: RoleItem[];
	loading?: boolean;
	pagination?: any;
	onPageChange?: (page: number, pageSize: number) => void;
	onEdit: (role: RoleItem) => void;
	onDelete: (role: RoleItem) => void;
}

export default function RoleTableList({ data, loading = false, pagination, onPageChange, onEdit, onDelete }: RoleTableListProps) {
	const renderColumns = {
		name: (val: string, record: RoleItem) => (
			<Space>
				{record.slug === 'admin' ? <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} /> : <SafetyCertificateOutlined style={{ color: '#EC008C', fontSize: 14 }} />}
				<Text strong>{val}</Text>
			</Space>
		),
		slug: (val: string) => (
			<Tag color={val === 'admin' ? 'gold' : 'blue'} style={{ fontFamily: 'monospace' }}>
				{val}
			</Tag>
		),
		permissions_count: (val: number, record: RoleItem) => {
			const count = val ?? record.permissions?.length ?? 0;
			return (
				<Tag color={count > 0 ? 'geekblue' : 'default'}>
					{count} {count === 1 ? 'Permission' : 'Permissions'}
				</Tag>
			);
		},
		created_at: (val: string) => (
			<Text type="secondary" style={{ fontSize: 13 }}>
				{val ? new Date(val).toLocaleDateString() : '-'}
			</Text>
		),
	};

	return (
		<TableComponent
			columns={roleTableColumns}
			data={data}
			loading={loading}
			pagination={pagination}
			onPageChange={onPageChange}
			renderColumns={renderColumns}
			onEdit={onEdit}
			onDelete={onDelete}
			canDelete={(record) => record.slug !== 'admin'}
			deleteConfirmTitle={(record) => `Are you sure you want to delete role '${record.name}'?`}
			permissionModule="role"
			rowKey="id"
		/>
	);
}
