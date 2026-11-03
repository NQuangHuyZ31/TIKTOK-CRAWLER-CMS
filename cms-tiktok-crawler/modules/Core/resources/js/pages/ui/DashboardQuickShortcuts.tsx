import React, { useMemo } from 'react';
import { Card, Space, Typography } from 'antd';
import { ThunderboltOutlined, PlusOutlined, ArrowRightOutlined, RobotOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import usePermission, { type PermissionAction } from '../../hooks/usePermission';
import SystemHealthCard from './SystemHealthCard';

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
	module?: string;
	action?: PermissionAction;
}

const shortcuts: ShortcutItem[] = [
	{
		title: 'Create New Crawl Job',
		description: 'Collect by username or profile link',
		icon: <PlusOutlined />,
		color: '#1677ff',
		bgHover: '#e6f4ff',
		path: '/crawler/crawl-job/form',
		module: 'crawler',
		action: 'create',
	},
	{
		title: 'Manage Crawl Jobs',
		description: 'View list, restart or delete jobs',
		icon: <RobotOutlined />,
		color: '#722ed1',
		bgHover: '#f9f0ff',
		path: '/crawler/crawl-job',
		module: 'crawler',
		action: 'view',
	},
	{
		title: 'Explore TikTok Profiles',
		description: 'Lookup followers, likes, and avatars',
		icon: <UserOutlined />,
		color: '#13c2c2',
		bgHover: '#e6fffb',
		path: '/tiktok-account',
		module: 'tiktok_account',
		action: 'view',
	},
	{
		title: 'User Management',
		description: 'Manage users, roles and permissions',
		icon: <TeamOutlined />,
		color: '#eb2f96',
		bgHover: '#fff0f6',
		path: '/user',
		module: 'user',
		action: 'view',
	},
];

export default function DashboardQuickShortcuts({ onNavigate }: DashboardQuickShortcutsProps) {
	const { canDoModule } = usePermission();

	const visibleShortcuts = useMemo(() => {
		return shortcuts.filter((item) => {
			if (!item.module) return true;
			return canDoModule(item.module, item.action || 'view');
		});
	}, [canDoModule]);

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			{visibleShortcuts.length > 0 && (
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
						{visibleShortcuts.map((item) => (
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
			)}

			<SystemHealthCard />
		</Space>
	);
}
