import React from 'react';
import { Alert, Row, Col, Space, Button, Tooltip, Badge, Tag } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PermissionGate from '../components/PermissionGate';
import usePermission from '../hooks/usePermission';
import DashboardKpiCards from './ui/DashboardKpiCards';
import DashboardGrowthCharts from './ui/DashboardGrowthCharts';
import CrawlEngineOverview from './ui/CrawlEngineOverview';
import TiktokEcosystemOverview from './ui/TiktokEcosystemOverview';
import DashboardQuickShortcuts from './ui/DashboardQuickShortcuts';
import RecentCrawlActivitiesCard from './ui/RecentCrawlActivitiesCard';
import { useDashboardData } from './ui/useDashboardData';

export default function DashboardPage() {
	const navigate = useNavigate();
	const { canDoModule } = usePermission();

	const {
		crawlerStats,
		tiktokStats,
		recentJobs,
		growthTrends,
		selectedPeriod,
		growthLoading,
		loading,
		refreshing,
		error,
		setError,
		lastUpdated,
		accountSuccessRate,
		activeAccountRate,
		loadDashboardData,
		handlePeriodChange,
	} = useDashboardData(30);

	const canViewCrawler = canDoModule('crawler', 'view');
	const canCreateCrawler = canDoModule('crawler', 'create');

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
							<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/crawler/crawl-job/create')}>
								Create Crawl Job
							</Button>
						</PermissionGate>
					</Space>
				}
			/>

			{error && <Alert type="error" message="Data Loading Error" description={error} showIcon closable onClose={() => setError('')} />}

			<DashboardKpiCards crawlerStats={crawlerStats} tiktokStats={tiktokStats} loading={loading} />

			<DashboardGrowthCharts
				growthTrends={growthTrends}
				loading={loading || growthLoading}
				selectedPeriod={selectedPeriod}
				onPeriodChange={handlePeriodChange}
			/>

			<Row gutter={[20, 20]}>
				<Col xs={24} lg={12}>
					<CrawlEngineOverview crawlerStats={crawlerStats} successRate={accountSuccessRate} />
				</Col>
				<Col xs={24} lg={12}>
					<TiktokEcosystemOverview tiktokStats={tiktokStats} activeRate={activeAccountRate} />
				</Col>
			</Row>

			<Row gutter={[20, 20]}>
				<Col xs={24} lg={16}>
					<RecentCrawlActivitiesCard
						recentJobs={recentJobs}
						totalJobs={crawlerStats?.total_jobs ?? 0}
						loading={loading}
						canViewCrawler={canViewCrawler}
						canCreateCrawler={canCreateCrawler}
					/>
				</Col>
				<Col xs={24} lg={8}>
					<DashboardQuickShortcuts onNavigate={(path) => navigate(path)} />
				</Col>
			</Row>
		</div>
	);
}
