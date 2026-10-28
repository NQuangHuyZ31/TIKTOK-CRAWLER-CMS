import React from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import TableComponent, { TableColumn } from '@core/components/Table';
import { getActivityActionConfig } from '../configs/activityLogConfig';
import type { ActivityLogItem } from '../Action/activityLog';

const { Text } = Typography;

interface ActivityLogTableProps {
	data: ActivityLogItem[];
	loading: boolean;
	pagination?: {
		current_page: number;
		per_page: number;
		total: number;
	};
	onPageChange: (page: number, pageSize: number) => void;
	onViewDetail: (item: ActivityLogItem) => void;
}

export default function ActivityLogTable({ data, loading, pagination, onPageChange, onViewDetail }: ActivityLogTableProps) {
	const renderActionTag = (action: string) => {
		const config = getActivityActionConfig(action);
		return <Tag color={config.color}>{config.label}</Tag>;
	};

	const columns: TableColumn<ActivityLogItem>[] = [
		{
			title: 'ID',
			dataIndex: 'id',
			key: 'id',
			width: 75,
			render: (id: number) => <Text style={{ fontFamily: 'monospace' }}>#{id}</Text>,
		},
		{
			title: 'Actor',
			key: 'actor',
			render: (_: any, record: ActivityLogItem) => (
				<Space direction="vertical" size={2}>
					<Text strong>{record.user_email}</Text>
					{record.user_role && (
						<Tag color="geekblue" style={{ fontSize: 11, lineHeight: '18px' }}>
							{record.user_role}
						</Tag>
					)}
				</Space>
			),
		},
		{
			title: 'Action',
			dataIndex: 'action',
			key: 'action',
			width: 150,
			render: (action: string) => renderActionTag(action),
		},
		{
			title: 'Module',
			dataIndex: 'module',
			key: 'module',
			width: 130,
			render: (mod: string) => <Tag color="purple">{mod}</Tag>,
		},
		{
			title: 'Target Record',
			key: 'record',
			render: (_: any, record: ActivityLogItem) => (
				<Space direction="vertical" size={2}>
					<Text code>{record.record_id || 'N/A'}</Text>
					{record.record_type && (
						<Text type="secondary" style={{ fontSize: 12 }}>
							{record.record_type}
						</Text>
					)}
				</Space>
			),
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			width: 110,
			render: (status: string) => {
				const isSuccess = status === 'SUCCESS';
				return (
					<Tag color={isSuccess ? 'success' : 'error'} icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
						{status}
					</Tag>
				);
			},
		},
		{
			title: 'Time',
			dataIndex: 'created_at',
			key: 'created_at',
			width: 170,
			render: (date: string) => <Text style={{ fontSize: 13, color: '#595959' }}>{date ? new Date(date).toLocaleString() : '-'}</Text>,
		},
		{
			title: 'Actions',
			key: 'operations',
			width: 90,
			render: (_: any, record: ActivityLogItem) => (
				<Tooltip title="View Snapshot & Changes">
					<Button type="text" icon={<EyeOutlined />} onClick={() => onViewDetail(record)} />
				</Tooltip>
			),
		},
	];

	return (
		<TableComponent<ActivityLogItem>
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
