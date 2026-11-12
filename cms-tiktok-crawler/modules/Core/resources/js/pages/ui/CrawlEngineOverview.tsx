import React from 'react';
import { Card, Progress, Row, Col, Flex, Space, Tag, Typography, theme } from 'antd';
import { ControlOutlined, ArrowRightOutlined, CheckCircleFilled, CloseCircleFilled, UserSwitchOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CardKPI from '../../components/CardKPI';
import formatCurrency from '../../utils/formatCurrency';
import { useTheme } from '../../contexts/ThemeContext';
import { CrawlerStatistics } from './types';

const { Text } = Typography;

export interface CrawlEngineOverviewProps {
	crawlerStats: CrawlerStatistics | null;
	successRate: number;
}

/**
 * Left panel showing Crawl Engine Performance, reusing CardKPI for consistent metric cards.
 */
export default function CrawlEngineOverview({ crawlerStats, successRate }: CrawlEngineOverviewProps) {
	const { token } = theme.useToken();
	const { isDark } = useTheme();
	const pendingOrRunningCount = Math.max(0, (crawlerStats?.total_jobs ?? 0) - (crawlerStats?.total_completed_jobs ?? 0) - (crawlerStats?.total_failed_jobs ?? 0));

	return (
		<Card
			title={
				<Space align="center">
					<ControlOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
					<span style={{ fontWeight: 600, fontSize: 16 }}>Crawl Engine Performance</span>
					<Tag color="magenta" style={{ borderRadius: 12, marginLeft: 6 }}>
						Crawl Engine
					</Tag>
				</Space>
			}
			extra={
				<Link to="/crawler/crawl-job" style={{ fontSize: 13, color: token.colorPrimary }}>
					View all jobs <ArrowRightOutlined />
				</Link>
			}
			style={{
				borderRadius: 14,
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
				height: '100%',
			}}
			styles={{ body: { padding: '20px 24px' } }}
		>
			{/* Progress Bar Rate */}
			<div style={{ marginBottom: 20 }}>
				<Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
					<Text type="secondary" style={{ fontSize: 13 }}>
						Account crawl success rate
					</Text>
					<Text strong style={{ color: successRate >= 80 ? '#52c41a' : token.colorPrimary, fontSize: 14 }}>
						{successRate}%
					</Text>
				</Flex>
				<Progress
					percent={successRate}
					strokeColor={{
						'0%': '#EC008C',
						'100%': '#7AC143',
					}}
					status={successRate === 100 ? 'success' : 'active'}
					showInfo={false}
				/>
			</div>

			{/* Sub-metrics Grid reusing CardKPI */}
			<Row gutter={[12, 12]}>
				<Col span={12}>
					<CardKPI
						title="Completed Jobs"
						value={crawlerStats?.total_completed_jobs ?? 0}
						icon={<CheckCircleFilled />}
						color="#52c41a"
						style={{ borderRadius: 10, ...(isDark ? {} : { background: '#f6ffed', borderColor: '#b7eb8f' }) }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Failed Jobs"
						value={crawlerStats?.total_failed_jobs ?? 0}
						icon={<CloseCircleFilled />}
						color="#ff4d4f"
						style={{ borderRadius: 10, ...(isDark ? {} : { background: '#fff1f0', borderColor: '#ffa39e' }) }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Successful Accounts"
						value={formatCurrency(crawlerStats?.total_success_accounts ?? 0)}
						icon={<UserSwitchOutlined />}
						color="#13c2c2"
						style={{ borderRadius: 10, ...(isDark ? {} : { background: '#e6fffb', borderColor: '#87e8de' }) }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Failed / Skipped Accounts"
						value={formatCurrency(crawlerStats?.total_failed_accounts ?? 0)}
						icon={<UserDeleteOutlined />}
						color="#fa541c"
						style={{ borderRadius: 10, ...(isDark ? {} : { background: '#fff2e8', borderColor: '#ffbb96' }) }}
					/>
				</Col>
			</Row>

			<div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 12 }}>
						Pending / Running Jobs:
					</Text>
					<Tag color="cyan" style={{ borderRadius: 10, fontWeight: 600 }}>
						{pendingOrRunningCount} active jobs
					</Tag>
				</Flex>
			</div>
		</Card>
	);
}
