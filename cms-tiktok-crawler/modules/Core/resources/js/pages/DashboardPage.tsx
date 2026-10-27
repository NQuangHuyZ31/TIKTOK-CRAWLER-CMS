import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Row, Col, Card, Space, Flex, Tag, Button, Tooltip, Badge } from 'antd';
import { ReloadOutlined, PlusOutlined, HistoryOutlined, ArrowRightOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardOverview } from '../Action/dashboard';
import PageHeader from '../components/PageHeader';
import TableComponent, { TableColumn } from '../components/Table';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import PermissionGate from '../components/PermissionGate';
import usePermission from '../hooks/usePermission';
import type { CrawlerStatistics, TiktokStatistics, CrawlJobItem } from './ui/types';
import DashboardKpiCards from './ui/DashboardKpiCards';
import CrawlEngineOverview from './ui/CrawlEngineOverview';
import TiktokEcosystemOverview from './ui/TiktokEcosystemOverview';
import DashboardQuickShortcuts from './ui/DashboardQuickShortcuts';

const recentJobColumns: TableColumn<CrawlJobItem>[] = [
	{
		title: 'Job ID',
		dataIndex: 'id',
		key: 'id',
		width: 100,
	},
	{
		title: 'Source Type',
		dataIndex: 'source_type',
		key: 'source_type',
	},
	{
		title: 'Progress',
		key: 'progress',
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 130,
	},
	{
		title: 'Created At',
		dataIndex: 'created_at',
		key: 'created_at',
	},
	{
		title: 'Action',
		key: 'action',
		width: 80,
		align: 'center',
		fixed: 'right',
	},
];

/**
 * Modern Dashboard Overview Page
 * Consumes dedicated core dashboard overview endpoint (/core/dashboard)
 * allowing users with only dashboard access to view metrics without requiring
 * direct crawler or tiktok_account module permissions.
 */
export default function DashboardPage() {
	const navigate = useNavigate();
	const { canDoModule } = usePermission();

	const [crawlerStats, setCrawlerStats] = useState<CrawlerStatistics | null>(null);
	const [tiktokStats, setTiktokStats] = useState<TiktokStatistics | null>(null);
	const [recentJobs, setRecentJobs] = useState<CrawlJobItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [lastUpdated, setLastUpdated] = useState<string>('');

	// Load metrics in a single aggregated request from Core Dashboard API
	const loadDashboardData = useCallback(async (isRefresh = false) => {
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}
		setError('');

		try {
			const res = await getDashboardOverview();
			const overview = res?.data;

			if (overview) {
				if (overview.crawler_statistics) {
					setCrawlerStats({
						total_jobs: Number(overview.crawler_statistics.total_jobs || 0),
						total_accounts: Number(overview.crawler_statistics.total_accounts || 0),
						total_success_accounts: Number(overview.crawler_statistics.total_success_accounts || 0),
						total_failed_accounts: Number(overview.crawler_statistics.total_failed_accounts || 0),
						total_completed_jobs: Number(overview.crawler_statistics.total_completed_jobs || 0),
						total_failed_jobs: Number(overview.crawler_statistics.total_failed_jobs || 0),
					});
				}

				if (overview.tiktok_statistics) {
					setTiktokStats({
						total_accounts: Number(overview.tiktok_statistics.total_accounts || 0),
						total_followers: Number(overview.tiktok_statistics.total_followers || 0),
						total_following: Number(overview.tiktok_statistics.total_following || 0),
						total_likes: Number(overview.tiktok_statistics.total_likes || 0),
						total_active_accounts: Number(overview.tiktok_statistics.total_active_accounts || 0),
						total_inactive_accounts: Number(overview.tiktok_statistics.total_inactive_accounts || 0),
					});
				}

				if (Array.isArray(overview.recent_jobs)) {
					setRecentJobs(overview.recent_jobs);
				}
			}

			setLastUpdated(new Date().toLocaleTimeString('en-US'));
		} catch (err: any) {
			setError(err?.message || 'Failed to load dashboard statistics.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadDashboardData();
	}, [loadDashboardData]);

	// Calculate Crawl Efficiency rates
	const totalProcessedAccounts = (crawlerStats?.total_success_accounts ?? 0) + (crawlerStats?.total_failed_accounts ?? 0);
	const accountSuccessRate = totalProcessedAccounts > 0 ? Math.round(((crawlerStats?.total_success_accounts ?? 0) / totalProcessedAccounts) * 100) : 0;

	// Calculate TikTok Active Profile rate
	const totalTiktokAccounts = tiktokStats?.total_accounts ?? 0;
	const activeAccountRate = totalTiktokAccounts > 0 ? Math.round(((tiktokStats?.total_active_accounts ?? 0) / totalTiktokAccounts) * 100) : 0;

	const canViewCrawler = canDoModule('crawler', 'view');

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			{/* Header reusing shared PageHeader directly */}
			<PageHeader
				title={
					<Space align="center" size={10}>
						<span>System Dashboard</span>
						<Badge status="processing" text={<span style={{ color: '#52c41a', fontSize: 13, fontWeight: 500 }}>Online</span>} />
					</Space>
				}
				description="Centralized monitoring of crawl jobs, TikTok accounts, and real-time engagement metrics."
				extra={
					<Space wrap size={12}>
						{lastUpdated && (
							<Tooltip title="Last fetched timestamp">
								<Tag>Updated: {lastUpdated}</Tag>
							</Tooltip>
						)}

						<Button icon={<ReloadOutlined spin={refreshing} />} onClick={() => loadDashboardData(true)} loading={refreshing}>
							Refresh
						</Button>

						<PermissionGate module="crawler" action="create">
							<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/crawler/crawl-job/form')}>
								Create Crawl Job
							</Button>
						</PermissionGate>
					</Space>
				}
			/>

			{/* Error Alert */}
			{error && <Alert type="error" message="Data Loading Error" description={error} showIcon closable onClose={() => setError('')} />}

			{/* Primary High-Level KPI Summary Cards */}
			<DashboardKpiCards crawlerStats={crawlerStats} tiktokStats={tiktokStats} loading={loading} />

			{/* Deep Analytics & Performance Breakdown */}
			<Row gutter={[20, 20]}>
				{/* Crawl Engine Analytical Breakdown */}
				<Col xs={24} lg={12}>
					<CrawlEngineOverview crawlerStats={crawlerStats} successRate={accountSuccessRate} />
				</Col>

				{/* TikTok Social Ecosystem Breakdown */}
				<Col xs={24} lg={12}>
					<TiktokEcosystemOverview tiktokStats={tiktokStats} activeRate={activeAccountRate} />
				</Col>
			</Row>

			{/* Recent Activity Table & Quick Action Shortcuts */}
			<Row gutter={[20, 20]}>
				{/* Recent Crawl Jobs: directly using TableComponent, StatusTag, EmptyState */}
				<Col xs={24} lg={16}>
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
									View all ({crawlerStats?.total_jobs ?? 0}) <ArrowRightOutlined />
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
										actionText={canDoModule('crawler', 'create') ? 'Create First Job' : undefined}
										onAction={canDoModule('crawler', 'create') ? () => navigate('/crawler/crawl-job/form') : undefined}
									/>
								),
							}}
						/>
					</Card>
				</Col>

				{/* Quick Shortcuts & System Status */}
				<Col xs={24} lg={8}>
					<DashboardQuickShortcuts onNavigate={(path) => navigate(path)} />
				</Col>
			</Row>
		</div>
	);
}
