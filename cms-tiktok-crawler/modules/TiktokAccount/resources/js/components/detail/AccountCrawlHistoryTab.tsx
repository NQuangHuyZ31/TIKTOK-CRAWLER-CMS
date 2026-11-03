import React, { useMemo } from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons';
import TableComponent from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { accountCrawlHistoryColumnConfig } from '../../configs/accountDetailConfig';

const { Text } = Typography;

interface AccountCrawlHistoryTabProps {
	data: any[];
	loading: boolean;
	pagination: { page: number; per_page: number; total: number };
	onPageChange: (page: number, per_page: number) => void;
	onRefresh: () => void;
}

export default function AccountCrawlHistoryTab({
	data,
	loading,
	pagination,
	onPageChange,
	onRefresh,
}: AccountCrawlHistoryTabProps) {
	const renderColumns = useMemo(
		() => ({
			id: (val: any) => <Text style={{ fontFamily: 'monospace' }}>#{val}</Text>,
			status: (status: string) => <StatusTag status={status} />,
			followers_count: (val: any) => <Text strong>{formatNumber(val ?? 0)}</Text>,
			following_count: (val: any) => formatNumber(val ?? 0),
			likes_count: (val: any) => formatNumber(val ?? 0),
			videos_crawled_count: (val: any) => (
				<Tag color={Number(val) > 0 ? 'purple' : 'default'}>
					{formatNumber(val ?? 0)} videos
				</Tag>
			),
			crawled_at: (val: any) => formatDateTime(val),
			error_message: (val: string) =>
				val ? (
					<Text type="danger" ellipsis={{ tooltip: val }} style={{ maxWidth: 220 }}>
						{val}
					</Text>
				) : (
					<Text type="secondary">-</Text>
				),
		}),
		[],
	);

	return (
		<Card
			title={
				<Space size={8}>
					<HistoryOutlined />
					<span>Crawl History ({formatNumber(pagination.total)})</span>
				</Space>
			}
			extra={
				<Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} size="small">
					Refresh
				</Button>
			}
		>
			<TableComponent
				columns={accountCrawlHistoryColumnConfig}
				data={data}
				pagination={pagination}
				handlePageChange={onPageChange}
				loading={loading}
				renderColumns={renderColumns}
			/>
		</Card>
	);
}
