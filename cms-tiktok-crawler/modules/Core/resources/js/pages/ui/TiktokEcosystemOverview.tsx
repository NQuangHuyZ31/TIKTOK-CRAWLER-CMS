import React from 'react';
import { Card, Progress, Row, Col, Flex, Space, Tag, Typography } from 'antd';
import { DatabaseOutlined, ArrowRightOutlined, UsergroupAddOutlined, HeartFilled, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CardKPI from '../../components/CardKPI';
import formatCurrency from '../../utils/formatCurrency';
import { TiktokStatistics } from './types';

const { Text } = Typography;

export interface TiktokEcosystemOverviewProps {
	tiktokStats: TiktokStatistics | null;
	activeRate: number;
}

/**
 * Right panel showing TikTok Social Ecosystem, reusing CardKPI for consistent metric cards.
 */
export default function TiktokEcosystemOverview({ tiktokStats, activeRate }: TiktokEcosystemOverviewProps) {
	return (
		<Card
			title={
				<Space align="center">
					<DatabaseOutlined style={{ color: '#722ed1', fontSize: 18 }} />
					<span style={{ fontWeight: 600, fontSize: 16 }}>TikTok Profile Ecosystem</span>
					<Tag color="purple" style={{ borderRadius: 12, marginLeft: 6 }}>
						Social Database
					</Tag>
				</Space>
			}
			extra={
				<Link to="/tiktok-account" style={{ fontSize: 13, color: '#722ed1' }}>
					View all profiles <ArrowRightOutlined />
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
					<Text type="secondary" style={{ fontSize: 13 }}>
						Active profile rate
					</Text>
					<Text strong style={{ color: activeRate >= 80 ? '#52c41a' : '#722ed1', fontSize: 14 }}>
						{activeRate}%
					</Text>
				</Flex>
				<Progress
					percent={activeRate}
					strokeColor={{
						'0%': '#722ed1',
						'100%': '#13c2c2',
					}}
					status="active"
					showInfo={false}
				/>
			</div>

			{/* Sub-metrics Grid reusing CardKPI */}
			<Row gutter={[12, 12]}>
				<Col span={12}>
					<CardKPI
						title="Total Followers"
						value={formatCurrency(tiktokStats?.total_followers ?? 0)}
						icon={<UsergroupAddOutlined />}
						color="#722ed1"
						style={{ borderRadius: 10, background: '#f9f0ff', borderColor: '#d3adf7' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Total Likes"
						value={formatCurrency(tiktokStats?.total_likes ?? 0)}
						icon={<HeartFilled />}
						color="#eb2f96"
						style={{ borderRadius: 10, background: '#fff0f6', borderColor: '#ffadd2' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Total Following"
						value={formatCurrency(tiktokStats?.total_following ?? 0)}
						icon={<UserAddOutlined />}
						color="#7cb305"
						style={{ borderRadius: 10, background: '#fcffe6', borderColor: '#eaff8f' }}
					/>
				</Col>

				<Col span={12}>
					<CardKPI
						title="Active Profiles"
						value={formatCurrency(tiktokStats?.total_active_accounts ?? 0)}
						icon={<UserOutlined />}
						color="#1677ff"
						style={{ borderRadius: 10, background: '#e6f7ff', borderColor: '#91caff' }}
					/>
				</Col>
			</Row>

			<div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 12 }}>
						Inactive / Paused Accounts:
					</Text>
					<Tag color="default" style={{ borderRadius: 10, fontWeight: 500 }}>
						{formatCurrency(tiktokStats?.total_inactive_accounts ?? 0)} accounts
					</Tag>
				</Flex>
			</div>
		</Card>
	);
}
