import React from 'react';
import { Card, Space, Flex, Typography, Tag, Badge } from 'antd';
import { ThunderboltOutlined, PlusOutlined, ArrowRightOutlined, RobotOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface DashboardQuickShortcutsProps {
	onNavigate: (path: string) => void;
}

interface ShortcutItem {
	title: string;
	description: string;
	icon: React.ReactNode;
	color: string;
	bgHover: string;
	path: string;
}

const shortcuts: ShortcutItem[] = [
	{
		title: 'Create New Crawl Job',
		description: 'Collect by username or profile link',
		icon: <PlusOutlined />,
		color: '#1677ff',
		bgHover: '#e6f4ff',
		path: '/crawler/crawl-job/form',
	},
	{
		title: 'Manage Crawl Jobs',
		description: 'View list, restart or delete jobs',
		icon: <RobotOutlined />,
		color: '#722ed1',
		bgHover: '#f9f0ff',
		path: '/crawler/crawl-job',
	},
	{
		title: 'Explore TikTok Profiles',
		description: 'Lookup followers, likes, and avatars',
		icon: <UserOutlined />,
		color: '#13c2c2',
		bgHover: '#e6fffb',
		path: '/tiktok-account',
	},
	{
		title: 'User Management',
		description: 'Manage users, roles and permissions',
		icon: <TeamOutlined />,
		color: '#eb2f96',
		bgHover: '#fff0f6',
		path: '/user',
	},
];

/**
 * Right sidebar panel featuring interactive quick action shortcuts
 * and CMS system status indicators.
 */
export default function DashboardQuickShortcuts({ onNavigate }: DashboardQuickShortcutsProps) {
	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			{/* Quick Action Shortcuts Card */}
			<Card
				title={
					<Space align="center">
						<ThunderboltOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
						<span style={{ fontWeight: 600, fontSize: 16 }}>Quick Actions</span>
					</Space>
				}
				style={{
					borderRadius: 14,
					border: '1px solid #edf0f5',
					boxShadow: '0 4px 16px rgba(23, 32, 51, 0.04)',
				}}
				styles={{ body: { padding: '16px 20px' } }}
			>
				<Space direction="vertical" size={10} style={{ width: '100%' }}>
					{shortcuts.map((item) => (
						<div
							key={item.path}
							onClick={() => onNavigate(item.path)}
							style={{
								padding: '12px 14px',
								borderRadius: 10,
								border: '1px solid #edf0f5',
								background: '#fafbfd',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								transition: 'all 0.2s',
							}}
							onMouseEnter={(e) => (e.currentTarget.style.background = item.bgHover)}
							onMouseLeave={(e) => (e.currentTarget.style.background = '#fafbfd')}
						>
							<Space size={12}>
								<div
									style={{
										width: 32,
										height: 32,
										borderRadius: 8,
										background: item.color,
										color: '#fff',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{item.icon}
								</div>
								<div>
									<div style={{ fontWeight: 600, fontSize: 14, color: '#172033' }}>{item.title}</div>
									<Text type="secondary" style={{ fontSize: 12 }}>
										{item.description}
									</Text>
								</div>
							</Space>
							<ArrowRightOutlined style={{ color: item.color }} />
						</div>
					))}
				</Space>
			</Card>

			{/* System Health Card */}
			<Card
				style={{
					borderRadius: 14,
					border: '1px solid #edf0f5',
					boxShadow: '0 4px 16px rgba(23, 32, 51, 0.04)',
				}}
				styles={{ body: { padding: '16px 20px' } }}
			>
				<Space direction="vertical" size={10} style={{ width: '100%' }}>
					<Flex justify="space-between" align="center">
						<Text type="secondary" style={{ fontSize: 13 }}>
							CMS Architecture:
						</Text>
						<Tag color="cyan" style={{ margin: 0, borderRadius: 4 }}>
							Ureka Modular
						</Tag>
					</Flex>
					<Flex justify="space-between" align="center">
						<Text type="secondary" style={{ fontSize: 13 }}>
							Crawl Pipeline:
						</Text>
						<Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
							Async Queue
						</Tag>
					</Flex>
					<Flex justify="space-between" align="center">
						<Text type="secondary" style={{ fontSize: 13 }}>
							Engine Status:
						</Text>
						<Badge status="success" text={<span style={{ fontSize: 13, color: '#52c41a', fontWeight: 500 }}>Ready</span>} />
					</Flex>
				</Space>
			</Card>
		</Space>
	);
}
