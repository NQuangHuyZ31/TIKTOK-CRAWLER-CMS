import React from 'react';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Flex, Layout, Space, Typography } from 'antd';
import { DownOutlined, LogoutOutlined, MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useLayout } from '../contexts/LayoutContext';
import { useCurrentRoute } from '../routes/registry';
import useCurrentUser from '../hooks/useCurrentUser';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
	const { user, initials, roleLabel, logout } = useCurrentUser();
	const { collapsed, toggleCollapsed, toggleMobileDrawer, isMobile } = useLayout();
	const currentRoute = useCurrentRoute();

	const accountMenuItems: MenuProps['items'] = [
		{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true },
	];

	const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
		if (key === 'logout') {
			await logout();
		}
	};

	const headerTitle = currentRoute?.title || currentRoute?.label || 'Dashboard';

	return (
		<AntHeader
			style={{
				background: '#ffffff',
				padding: isMobile ? '0 14px' : '0 24px',
				height: 70,
				flexShrink: 0,
				lineHeight: 'normal',
				borderBottom: '1px solid #edf0f5',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			{/* Left section: Hamburger toggle and current section badge */}
			<Flex align="center" gap={12}>
				<Button
					type="text"
					shape="circle"
					icon={
						collapsed ? (
							<MenuUnfoldOutlined style={{ fontSize: 17, color: '#344054' }} />
						) : (
							<MenuFoldOutlined style={{ fontSize: 17, color: '#344054' }} />
						)
					}
					onClick={toggleCollapsed}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					style={{ width: 38, height: 38 }}
				/>

				<span style={{ fontWeight: 600, fontSize: 15, color: '#172033' }}>
					{headerTitle}
				</span>
			</Flex>

			{/* Right section: User profile & Logout dropdown */}
			<Flex align="center" gap={isMobile ? 10 : 16}>
				<Dropdown menu={{ items: accountMenuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
					<Button
						type="text"
						style={{
							height: 44,
							padding: isMobile ? '4px' : '4px 8px 4px 4px',
							borderRadius: 8,
						}}
					>
						<Space size={isMobile ? 4 : 8}>
							<Avatar
								size={34}
								style={{
									background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
									color: '#ffffff',
									fontWeight: 600,
									fontSize: 13,
								}}
							>
								{initials}
							</Avatar>
							{!isMobile && (
								<span style={{ textAlign: 'left', lineHeight: 1.2 }}>
									<Text strong style={{ display: 'block', color: '#172033', fontSize: 13 }}>
										{user?.name || 'Administrator'}
									</Text>
									<Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
										{roleLabel}
									</Text>
								</span>
							)}
							<DownOutlined style={{ fontSize: 10, color: '#98a2b3' }} />
						</Space>
					</Button>
				</Dropdown>
			</Flex>
		</AntHeader>
	);
}
