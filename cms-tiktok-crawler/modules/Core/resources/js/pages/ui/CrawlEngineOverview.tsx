import React from 'react';
import { Card, Progress, Row, Col, Flex, Space, Tag, Typography } from 'antd';
import {
	ControlOutlined,
	ArrowRightOutlined,
	CheckCircleFilled,
	CloseCircleFilled,
	UserSwitchOutlined,
	UserDeleteOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CardKPI from '../../components/CardKPI';
import formatCurrency from '../../utils/formatCurrency';
import { CrawlerStatistics } from './types';

const { Text } = Typography;

export interface CrawlEngineOverviewProps {
	crawlerStats: CrawlerStatistics | null;
	successRate: number;
}

/**
 * Left panel showing Crawl Engine Performance, reusing CardKPI for consistent metric cards.
 */
export default function CrawlEngineOverview({
	crawlerStats,
	successRate,
}: CrawlEngineOverviewProps) {
	const pendingOrRunningCount = Math.max(
		0,
		(crawlerStats?.total_jobs ?? 0) -
		(crawlerStats?.total_completed_jobs ?? 0) -
		(crawlerStats?.total_failed_jobs ?? 0)
	);

	return (
		<Card
			title={
				<Space align="center">
					<ControlOutlined style={{ color: '#1677ff', fontSize: 18 }} />
					<span style={{ fontWeight: 600, fontSize: 16 }}>Hiệu Năng Bộ Cào Dữ Liệu</span>
					<Tag color="blue" style={{ borderRadius: 12, marginLeft: 6 }}>Crawl Engine</Tag>
				</Space>
			}
			extra={
				<Link to="/crawler/crawl-job" style={{ fontSize: 13, color: '#1677ff' }}>
					Xem tất cả jobs <ArrowRightOutlined />
				</Link>
			}
			style={{
				borderRadius: 14,
				border: '1px solid #edf0f5',
				boxShadow: '0 4px 16px rgba(23, 32, 51, 0.04)',
				height: '100%',
			}}
			styles={{ body: { padding: '20px 24px' } }}
		>
			{/* Progress Bar Rate */}
			<div style={{ marginBottom: 20 }}>
				<Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
					<Text type="secondary" style={{ fontSize: 13 }}>Tỷ lệ cào tài khoản thành công</Text>
					<Text strong style={{ color: successRate >= 80 ? '#52c41a' : '#1677ff', fontSize: 14 }}>
						{successRate}%
					</Text>
				</Flex>
				<Progress
					percent={successRate}
					strokeColor={{
						'0%': '#1677ff',
						'100%': '#52c41a',
					}}
					status={successRate === 100 ? 'success' : 'active'}
					showInfo={false}
				/>
			</div>

			{/* Sub-metrics Grid reusing CardKPI */}
			<Row gutter={[12, 12]}>
				<Col span={12}>
					<CardKPI
						title="Jobs Hoàn tất"
						value={crawlerStats?.total_completed_jobs ?? 0}
						icon={<CheckCircleFilled />}
						color="#52c41a"
						style={{ borderRadius: 10, background: '#f6ffed', borderColor: '#b7eb8f' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Jobs Thất bại"
						value={crawlerStats?.total_failed_jobs ?? 0}
						icon={<CloseCircleFilled />}
						color="#ff4d4f"
						style={{ borderRadius: 10, background: '#fff1f0', borderColor: '#ffa39e' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Tài khoản Thành công"
						value={formatCurrency(crawlerStats?.total_success_accounts ?? 0)}
						icon={<UserSwitchOutlined />}
						color="#13c2c2"
						style={{ borderRadius: 10, background: '#e6fffb', borderColor: '#87e8de' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Tài khoản Lỗi / Bỏ qua"
						value={formatCurrency(crawlerStats?.total_failed_accounts ?? 0)}
						icon={<UserDeleteOutlined />}
						color="#fa541c"
						style={{ borderRadius: 10, background: '#fff2e8', borderColor: '#ffbb96' }}
					/>
				</Col>
			</Row>

			<div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 12 }}>
						Tổng số tác vụ đang chờ / chạy:
					</Text>
					<Tag color="cyan" style={{ borderRadius: 10, fontWeight: 600 }}>
						{pendingOrRunningCount} job đang xử lý
					</Tag>
				</Flex>
			</div>
		</Card>
	);
}
