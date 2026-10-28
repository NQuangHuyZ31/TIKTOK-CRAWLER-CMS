import React from 'react';
import { Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DesktopOutlined, MobileOutlined, TabletOutlined } from '@ant-design/icons';
import TableComponent, { TableColumn } from '@core/components/Table';
import type { LoginLogItem } from '../Action/loginLog';

const { Text } = Typography;

interface LoginLogTableProps {
	data: LoginLogItem[];
	loading: boolean;
	pagination?: {
		current_page: number;
		per_page: number;
		total: number;
	};
	onPageChange: (page: number, pageSize: number) => void;
}

export default function LoginLogTable({ data, loading, pagination, onPageChange }: LoginLogTableProps) {
	const columns: TableColumn<LoginLogItem>[] = [
		{
			title: 'ID',
			dataIndex: 'id',
			key: 'id',
			width: 80,
			render: (id: number) => <Text style={{ fontFamily: 'monospace' }}>#{id}</Text>,
		},
		{
			title: 'User Email',
			dataIndex: 'email',
			key: 'email',
			render: (email: string) => <Text strong>{email}</Text>,
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			width: 120,
			render: (status: string) => {
				const isSuccess = status?.toLowerCase() === 'success';
				return (
					<Tag color={isSuccess ? 'success' : 'error'} icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
						{status?.toUpperCase()}
					</Tag>
				);
			},
		},
		{
			title: 'Device',
			dataIndex: 'device',
			key: 'device',
			width: 120,
			render: (device: string | null) => {
				if (!device) return <Text type="secondary">-</Text>;
				const icon = device === 'Mobile' ? <MobileOutlined /> : device === 'Tablet' ? <TabletOutlined /> : <DesktopOutlined />;
				return (
					<Tag icon={icon} color="default">
						{device}
					</Tag>
				);
			},
		},
		{
			title: 'IP Address',
			dataIndex: 'ip_address',
			key: 'ip_address',
			width: 140,
			render: (ip: string | null) => <Text copyable={Boolean(ip)} style={{ fontFamily: 'monospace' }}>{ip || '-'}</Text>,
		},
		{
			title: 'Failure Reason',
			dataIndex: 'failure_reason',
			key: 'failure_reason',
			render: (reason: string | null) =>
				reason ? (
					<Tag color="volcano">{reason.replace(/_/g, ' ')}</Tag>
				) : (
					<Text type="secondary">-</Text>
				),
		},
		{
			title: 'Time',
			dataIndex: 'created_at',
			key: 'created_at',
			width: 180,
			render: (date: string) => (
				<Text style={{ fontSize: 13, color: '#595959' }}>
					{date ? new Date(date).toLocaleString() : '-'}
				</Text>
			),
		},
	];

	return (
		<TableComponent<LoginLogItem>
			columns={columns}
			data={data}
			loading={loading}
			rowKey="id"
			pagination={
				pagination
					? {
							current_page: pagination.current_page,
							per_page: pagination.per_page,
							total: pagination.total,
						}
					: false
			}
			onPageChange={onPageChange}
		/>
	);
}
