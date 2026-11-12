import React from 'react';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Flex, Layout, Space, Tooltip, Typography, theme } from 'antd';
import { BookOutlined, DownOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrentRoute } from '../routes/registry';
import useCurrentUser from '../hooks/useCurrentUser';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
	const navigate = useNavigate();
	const { token } = theme.useToken();
	const { isDark, toggleTheme } = useTheme();
	const { user, initials, roleLabel, logout } = useCurrentUser();
	const { collapsed, toggleCollapsed, isMobile } = useLayout();
	const currentRoute = useCurrentRoute();

	const accountMenuItems: MenuProps['items'] = [{ key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', danger: true }];

	const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
		if (key === 'logout') {
			await logout();
		}
	};

	const headerTitle = currentRoute?.title || currentRoute?.label || 'Dashboard';

	return (
		<AntHeader
			style={{
				background: token.colorBgContainer,
				padding: isMobile ? '0 14px' : '0 24px',
				height: 70,
				flexShrink: 0,
				lineHeight: 'normal',
				borderBottom: `1px solid ${token.colorBorderSecondary}`,
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
					icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 17, color: token.colorText }} /> : <MenuFoldOutlined style={{ fontSize: 17, color: token.colorText }} />}
					onClick={toggleCollapsed}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					style={{ width: 38, height: 38 }}
				/>

				<span style={{ fontWeight: 600, fontSize: 15, color: token.colorText }}>{headerTitle}</span>
			</Flex>

			{/* Right section: Theme toggle, Guidelines & User profile */}
			<Flex align="center" gap={isMobile ? 10 : 12}>
				<Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
					<Button
						type="default"
						shape="circle"
						icon={isDark ? <SunOutlined /> : <MoonOutlined />}
						onClick={toggleTheme}
						aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
						style={{
							width: 38,
							height: 38,
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderColor: token.colorBorder,
						}}
					/>
				</Tooltip>

				<Button
					type="default"
					icon={<BookOutlined style={{ color: token.colorPrimary }} />}
					onClick={() => navigate('/guideline')}
					style={{
						height: 38,
						borderRadius: 8,
						fontSize: 13,
						display: 'inline-flex',
						alignItems: 'center',
						borderColor: token.colorBorder,
					}}
				>
					{!isMobile && 'Guidelines & Docs'}
				</Button>

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
									background: 'linear-gradient(135deg, #EC008C 0%, #ff4da6 100%)',
									color: '#ffffff',
									fontWeight: 600,
									fontSize: 13,
								}}
							>
								{initials}
							</Avatar>
							{!isMobile && (
								<span style={{ textAlign: 'left', lineHeight: 1.2 }}>
									<Text strong style={{ display: 'block', color: token.colorText, fontSize: 13 }}>
										{user?.name || 'Administrator'}
									</Text>
									<Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
										{roleLabel}
									</Text>
								</span>
							)}
							<DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
						</Space>
					</Button>
				</Dropdown>
			</Flex>
		</AntHeader>
	);
}
