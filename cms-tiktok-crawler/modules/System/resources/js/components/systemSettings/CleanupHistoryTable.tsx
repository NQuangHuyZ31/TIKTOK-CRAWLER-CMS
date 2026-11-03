import React from 'react';
import { Flex, Button, Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import TableComponent, { TableColumn } from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import type { CleanupHistoryItem } from '../../Action/systemSetting';

const { Text, Title } = Typography;

export interface CleanupHistoryTableProps {
	cleanupHistory: CleanupHistoryItem[];
	loading?: boolean;
	onRefresh: () => void;
}

const historyColumns: TableColumn<CleanupHistoryItem>[] = [
	{
		title: 'Execution Time',
		dataIndex: 'executed_at',
		key: 'executed_at',
		width: 180,
		render: (val: string) => <Text strong>{val || 'N/A'}</Text>,
	},
	{
		title: 'Trigger',
		dataIndex: 'trigger',
		key: 'trigger',
		width: 140,
		render: (val: string) => {
			const isAuto = val === 'scheduled';
			return <StatusTag status={isAuto ? 'active' : 'info'} label={isAuto ? 'Scheduled' : val === 'artisan_cli' ? 'Artisan CLI' : 'Manual Admin'} />;
		},
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
		render: (val: string) => <StatusTag status={val === 'success' ? 'success' : val === 'running' ? 'pending' : 'failed'} label={val} />,
	},
	{
		title: 'Total Purged',
		dataIndex: 'purged_count',
		key: 'purged_count',
		width: 130,
		render: (val: number) => <Text style={{ color: '#1677ff', fontWeight: 600 }}>{val?.toLocaleString() ?? 0} rows</Text>,
	},
	{
		title: 'Activity Logs',
		dataIndex: 'activity_logs_purged',
		key: 'activity_logs_purged',
		width: 120,
		render: (val: number) => `${val?.toLocaleString() ?? 0} rows`,
	},
	{
		title: 'Login Logs',
		dataIndex: 'login_logs_purged',
		key: 'login_logs_purged',
		width: 120,
		render: (val: number) => `${val?.toLocaleString() ?? 0} rows`,
	},
	{
		title: 'Duration',
		dataIndex: 'duration_sec',
		key: 'duration_sec',
		width: 110,
		render: (val: number) => `${val ?? 0}s`,
	},
	{
		title: 'Details / Error',
		dataIndex: 'error_message',
		key: 'error_message',
		render: (val: string | null) => (val ? <Text type="danger">{val}</Text> : <Text type="secondary">Completed without errors</Text>),
	},
];

export default function CleanupHistoryTable({ cleanupHistory, loading = false, onRefresh }: CleanupHistoryTableProps) {
	return (
		<div>
			<Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
				<div>
					<Title level={5} style={{ margin: 0 }}>
						Recent Cleanup Logs
					</Title>
					<Text type="secondary">Audit records of the last 10 scheduled and manual pruning runs.</Text>
				</div>
				<Button icon={<SyncOutlined />} onClick={onRefresh}>
					Refresh History
				</Button>
			</Flex>
			<TableComponent<CleanupHistoryItem> columns={historyColumns} data={cleanupHistory || []} rowKey="id" pagination={false} loading={loading} />
		</div>
	);
}
