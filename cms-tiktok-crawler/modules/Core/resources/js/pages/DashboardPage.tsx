import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Row, Col, Card, Space, Flex, Tag, Button, Tooltip, Badge } from 'antd';
import {
	ReloadOutlined,
	PlusOutlined,
	HistoryOutlined,
	ArrowRightOutlined,
	EyeOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../Action/api';
import PageHeader from '../components/PageHeader';
import TableComponent, { TableColumn } from '../components/Table';
import StatusTag from '../components/StatusTag';
import EmptyState from '../components/EmptyState';
import {
	CrawlerStatistics,
	TiktokStatistics,
	CrawlJobItem,
	DashboardKpiCards,
	CrawlEngineOverview,
	TiktokEcosystemOverview,
	DashboardQuickShortcuts,
} from './ui';

const recentJobColumns: TableColumn<CrawlJobItem>[] = [
	{
		title: 'Mã Job',
		dataIndex: 'id',
		key: 'id',
		width: 100,
	},
	{
		title: 'Nguồn thu thập',
		dataIndex: 'source_type',
		key: 'source_type',
	},
	{
		title: 'Tiến độ tài khoản',
		key: 'progress',
	},
	{
		title: 'Trạng thái',
		dataIndex: 'status',
		key: 'status',
		width: 130,
	},
	{
		title: 'Thời gian tạo',
		dataIndex: 'created_at',
		key: 'created_at',
	},
	{
		title: 'Thao tác',
		key: 'action',
		width: 100,
	},
];

/**
 * Modern Dashboard Overview Page
 * Directly reuses core components (PageHeader, TableComponent, StatusTag, EmptyState, CardKPI)
 * and focuses sub-components on domain-specific analytical cards.
 */
export default function DashboardPage() {
	const navigate = useNavigate();

	const [crawlerStats, setCrawlerStats] = useState<CrawlerStatistics | null>(null);
	const [tiktokStats, setTiktokStats] = useState<TiktokStatistics | null>(null);
	const [recentJobs, setRecentJobs] = useState<CrawlJobItem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [lastUpdated, setLastUpdated] = useState<string>('');

	// Load metrics in parallel from Crawler and TiktokAccount modules
	const loadDashboardData = useCallback(async (isRefresh = false) => {
		if (isRefresh) {
			setRefreshing(true);
		} else {
			setLoading(true);
		}
		setError('');

		try {
			const [crawlerRes, tiktokRes, jobsRes] = await Promise.allSettled([
				api('/crawler/crawl-job/statistics-summary'),
				api('/tiktok-account/tiktok-account/statistic-summary'),
				api('/crawler/crawl-job', { params: { per_page: 5 } }),
			]);

			// 1. Process Crawler statistics
			if (crawlerRes.status === 'fulfilled') {
				const cData = crawlerRes.value?.data ?? crawlerRes.value ?? {};
				setCrawlerStats({
					total_jobs: Number(cData.total_jobs || 0),
					total_accounts: Number(cData.total_accounts || 0),
					total_success_accounts: Number(cData.total_success_accounts || 0),
					total_failed_accounts: Number(cData.total_failed_accounts || 0),
					total_completed_jobs: Number(cData.total_completed_jobs || 0),
					total_failed_jobs: Number(cData.total_failed_jobs || 0),
				});
			}

			// 2. Process TikTok statistics
			if (tiktokRes.status === 'fulfilled') {
				const tData = tiktokRes.value?.data ?? tiktokRes.value ?? {};
				setTiktokStats({
					total_accounts: Number(tData.total_accounts || 0),
					total_followers: Number(tData.total_followers || 0),
					total_following: Number(tData.total_following || 0),
					total_likes: Number(tData.total_likes || 0),
					total_active_accounts: Number(tData.total_active_accounts || 0),
					total_inactive_accounts: Number(tData.total_inactive_accounts || 0),
				});
			}

			// 3. Process Recent Jobs list
			if (jobsRes.status === 'fulfilled') {
				const jData = jobsRes.value?.data ?? jobsRes.value ?? [];
				setRecentJobs(Array.isArray(jData) ? jData : []);
			}

			setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
		} catch (err: any) {
			setError(err?.message || 'Không thể nạp dữ liệu thống kê bảng điều khiển.');
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

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
			{/* Header reusing shared PageHeader directly */}
			<PageHeader
				title={
					<Space align="center" size={10}>
						<span>Bảng Điều Khiển Tổng Quan</span>
						<Badge status="processing" text={<span style={{ color: '#52c41a', fontSize: 13, fontWeight: 500 }}>Online</span>} />
					</Space>
				}
				description="Giám sát tập trung toàn bộ tiến trình cào dữ liệu, tài khoản TikTok và các chỉ số tương tác thời gian thực."
				extra={
					<Space wrap size={12}>
						{lastUpdated && (
							<Tooltip title="Thời điểm lấy dữ liệu gần nhất">
								<Tag>Cập nhật: {lastUpdated}</Tag>
							</Tooltip>
						)}

						<Button
							icon={<ReloadOutlined spin={refreshing} />}
							onClick={() => loadDashboardData(true)}
							loading={refreshing}
						>
							Làm mới
						</Button>

						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => navigate('/crawler/crawl-job/create')}
						>
							Tạo Crawl Job
						</Button>
					</Space>
				}
			/>

			{/* Error Alert */}
			{error && <Alert type="error" message="Lỗi nạp dữ liệu" description={error} showIcon closable onClose={() => setError('')} />}

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
								<span style={{ fontWeight: 600, fontSize: 16 }}>Hoạt Động Crawl Gần Nhất</span>
							</Space>
						}
						extra={
							<Link to="/crawler/crawl-job" style={{ fontSize: 13, color: '#1677ff' }}>
								Xem tất cả ({crawlerStats?.total_jobs ?? 0}) <ArrowRightOutlined />
							</Link>
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
								id: (id) => (
									<Link to={`/crawler/crawl-job/${id}`} style={{ fontWeight: 600, color: '#1677ff' }}>
										#{id}
									</Link>
								),
								source_type: (sourceType) => {
									const type = String(sourceType || 'usernames').toLowerCase();
									const color = type.includes('url') ? 'geekblue' : type.includes('tag') ? 'purple' : 'blue';
									return <Tag color={color} style={{ borderRadius: 4, textTransform: 'uppercase', fontSize: 11 }}>{type}</Tag>;
								},
								progress: (_, record) => (
									<Flex align="center" gap={6}>
										<span style={{ fontSize: 13, fontWeight: 500 }}>
											{record.total_accounts ?? 0} mục
										</span>
										<span style={{ fontSize: 12, color: '#52c41a' }}>
											({record.success_count ?? 0} ✓)
										</span>
										{Number(record.failed_count || 0) > 0 && (
											<span style={{ fontSize: 12, color: '#ff4d4f' }}>
												({record.failed_count} ✗)
											</span>
										)}
									</Flex>
								),
								status: (status) => <StatusTag status={status} />,
								created_at: (dateStr) => {
									if (!dateStr) return '-';
									try {
										return new Date(dateStr).toLocaleString('vi-VN', {
											hour: '2-digit',
											minute: '2-digit',
											day: '2-digit',
											month: '2-digit',
										});
									} catch {
										return dateStr;
									}
								},
								action: (_, record) => (
									<Link to={`/crawler/crawl-job/${record.id}`}>
										<Button size="small" type="link" icon={<EyeOutlined />}>
											Xem
										</Button>
									</Link>
								),
							}}
							locale={{
								emptyText: (
									<EmptyState
										description="Chưa có crawl job nào được tạo"
										actionText="Tạo job đầu tiên"
										onAction={() => navigate('/crawler/crawl-job/create')}
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
