import React from 'react';
import { Button, Card, Flex, Space, Tag, Tooltip } from 'antd';
import { ArrowRightOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import TableComponent, { TableColumn } from '../../components/Table';
import StatusTag from '../../components/StatusTag';
import EmptyState from '../../components/EmptyState';
import type { CrawlJobItem } from './types';

const recentJobColumns: TableColumn<CrawlJobItem>[] = [
	{ title: 'Job ID', dataIndex: 'id', key: 'id', width: 100 },
	{ title: 'Source Type', dataIndex: 'source_type', key: 'source_type' },
	{ title: 'Progress', key: 'progress' },
	{ title: 'Status', dataIndex: 'status', key: 'status', width: 130 },
	{ title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
	{ title: 'Action', key: 'action', width: 80, align: 'center', fixed: 'right' },
];

export interface RecentCrawlActivitiesCardProps {
	recentJobs: CrawlJobItem[];
	totalJobs: number;
	loading?: boolean;
	canViewCrawler: boolean;
	canCreateCrawler: boolean;
}

export default function RecentCrawlActivitiesCard({
	recentJobs,
	totalJobs,
	loading = false,
	canViewCrawler,
	canCreateCrawler,
}: RecentCrawlActivitiesCardProps) {
	const navigate = useNavigate();

	return (
		<Card
			title={
				<Space align="center">
					<HistoryOutlined style={{ color: '#1677ff', fontSize: 18 }} />
					<span style={{ fontWeight: 600, fontSize: 16 }}>Recent Crawl Activities</span>
				</Space>
			}
			extra={
				canViewCrawler ? (
					<Link to="/crawler/crawl-job" style={{ fontSize: 13, color: '#1677ff' }}>
						View all ({totalJobs}) <ArrowRightOutlined />
					</Link>
				) : null
			}
			style={{
				borderRadius: 14,
				border: '1px solid #edf0f5',
				boxShadow: '0 4px 16px rgba(23, 32, 51, 0.04)',
			}}
			styles={{ body: { padding: 0 } }}
		>
			<TableComponent<CrawlJobItem>
				columns={recentJobColumns}
				data={recentJobs}
				rowKey="id"
				pagination={false}
				loading={loading}
				size="middle"
				renderColumns={{
					id: (id) =>
						canViewCrawler ? (
							<Link to={`/crawler/crawl-job/${id}`} style={{ fontWeight: 600, color: '#1677ff' }}>
								#{id}
							</Link>
						) : (
							<span style={{ fontWeight: 600, color: '#595959' }}>#{id}</span>
						),
					source_type: (sourceType) => {
						const type = String(sourceType || 'usernames').toLowerCase();
						const color = type.includes('url') ? 'geekblue' : type.includes('tag') ? 'purple' : 'blue';
						return (
							<Tag color={color} style={{ borderRadius: 4, textTransform: 'uppercase', fontSize: 11 }}>
								{type}
							</Tag>
						);
					},
					progress: (_, record) => (
						<Flex align="center" gap={6}>
							<span style={{ fontSize: 13, fontWeight: 500 }}>{record.total_accounts ?? 0} items</span>
							<span style={{ fontSize: 12, color: '#52c41a' }}>({record.success_count ?? 0} ✓)</span>
							{Number(record.failed_count || 0) > 0 && <span style={{ fontSize: 12, color: '#ff4d4f' }}>({record.failed_count} ✗)</span>}
						</Flex>
					),
					status: (status) => <StatusTag status={status} />,
					created_at: (dateStr) => {
						if (!dateStr) return '-';
						try {
							return new Date(dateStr).toLocaleString('en-US', {
								hour: '2-digit',
								minute: '2-digit',
								day: '2-digit',
								month: '2-digit',
							});
						} catch {
							return dateStr;
						}
					},
					action: (_, record) =>
						canViewCrawler ? (
							<Tooltip title="View Details">
								<Link to={`/crawler/crawl-job/${record.id}`}>
									<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
								</Link>
							</Tooltip>
						) : (
							<span style={{ color: '#bfbfbf' }}>-</span>
						),
				}}
				locale={{
					emptyText: (
						<EmptyState
							description="No crawl jobs created yet"
							actionText={canCreateCrawler ? 'Create First Job' : undefined}
							onAction={canCreateCrawler ? () => navigate('/crawler/crawl-job/form') : undefined}
						/>
					),
				}}
			/>
		</Card>
	);
}
