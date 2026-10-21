import React from 'react';
import { Row, Col, Flex } from 'antd';
import { RobotOutlined, CloudDownloadOutlined, UserOutlined, LikeOutlined } from '@ant-design/icons';
import CardKPI from '../../components/CardKPI';
import formatCurrency from '../../utils/formatCurrency';
import { CrawlerStatistics, TiktokStatistics } from './types';

export interface DashboardKpiCardsProps {
	crawlerStats: CrawlerStatistics | null;
	tiktokStats: TiktokStatistics | null;
	loading: boolean;
}

/**
 * 4 Primary High-Level KPI Summary Cards
 * (Total Jobs, Crawl Target Accounts, TikTok Profiles, Total Likes)
 */
export default function DashboardKpiCards({ crawlerStats, tiktokStats, loading }: DashboardKpiCardsProps) {
	return (
		<Row gutter={[16, 16]}>
			{/* 1. Total Crawl Jobs */}
			<Col xs={24} sm={12} xl={6}>
				<CardKPI
					title="Total Crawl Jobs"
					value={crawlerStats?.total_jobs ?? 0}
					icon={<RobotOutlined />}
					color="#1677ff"
					loading={loading}
					subtext={
						<Flex justify="space-between" align="center" style={{ fontSize: 12 }}>
							<span style={{ color: '#52c41a', fontWeight: 500 }}>● {crawlerStats?.total_completed_jobs ?? 0} completed</span>
							<span style={{ color: '#ff4d4f', fontWeight: 500 }}>● {crawlerStats?.total_failed_jobs ?? 0} failed</span>
						</Flex>
					}
				/>
			</Col>

			{/* 2. Total Target Accounts In Scope */}
			<Col xs={24} sm={12} xl={6}>
				<CardKPI
					title="Target Accounts"
					value={formatCurrency(crawlerStats?.total_accounts ?? 0)}
					icon={<CloudDownloadOutlined />}
					color="#722ed1"
					loading={loading}
					subtext={
						<Flex justify="space-between" align="center" style={{ fontSize: 12 }}>
							<span style={{ color: '#52c41a', fontWeight: 500 }}>● {formatCurrency(crawlerStats?.total_success_accounts ?? 0)} success</span>
							<span style={{ color: '#ff4d4f', fontWeight: 500 }}>● {formatCurrency(crawlerStats?.total_failed_accounts ?? 0)} failed</span>
						</Flex>
					}
				/>
			</Col>

			{/* 3. Total Stored TikTok Accounts */}
			<Col xs={24} sm={12} xl={6}>
				<CardKPI
					title="Stored Profiles"
					value={formatCurrency(tiktokStats?.total_accounts ?? 0)}
					icon={<UserOutlined />}
					color="#13c2c2"
					loading={loading}
					subtext={
						<Flex justify="space-between" align="center" style={{ fontSize: 12 }}>
							<span style={{ color: '#52c41a', fontWeight: 500 }}>● {formatCurrency(tiktokStats?.total_active_accounts ?? 0)} active</span>
							<span style={{ color: '#8c8c8c', fontWeight: 500 }}>● {formatCurrency(tiktokStats?.total_inactive_accounts ?? 0)} inactive</span>
						</Flex>
					}
				/>
			</Col>

			{/* 4. Total Social Engagement (Likes) */}
			<Col xs={24} sm={12} xl={6}>
				<CardKPI
					title="Total Crawled Likes"
					value={formatCurrency(tiktokStats?.total_likes ?? 0)}
					icon={<LikeOutlined />}
					color="#fa8c16"
					loading={loading}
					subtext={
						<Flex justify="space-between" align="center" style={{ fontSize: 12 }}>
							<span style={{ color: '#1677ff', fontWeight: 500 }}>👥 {formatCurrency(tiktokStats?.total_followers ?? 0)} followers</span>
							<span style={{ color: '#52c41a', fontWeight: 500 }}>🔗 {formatCurrency(tiktokStats?.total_following ?? 0)} following</span>
						</Flex>
					}
				/>
			</Col>
		</Row>
	);
}
