import React, { useEffect, useMemo, useState } from 'react';
import { Flex, Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMenuRoutes, useCurrentRoute, type RouteDef } from '../routes/registry';
import { useLayout } from '../contexts/LayoutContext';
import { useTheme } from '../contexts/ThemeContext';
import usePermission from '../hooks/usePermission';
import { buildSidebarMenuItems } from './sidebar/sidebarMenuBuilder';

const { Sider } = Layout;

export default function Sidebar() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { token } = theme.useToken();
	const { isDark } = useTheme();
	const menuRoutes = useMenuRoutes();
	const currentRoute = useCurrentRoute();
	const { collapsed, toggleCollapsed } = useLayout();
	const { isAdmin, can } = usePermission();

	const [openKeys, setOpenKeys] = useState<string[]>([]);

	const menuItems = useMemo(() => buildSidebarMenuItems({ routes: menuRoutes, isAdmin, can, pathname, collapsed, navigate, setOpenKeys }), [menuRoutes, isAdmin, can, pathname, collapsed, navigate]);

	const selectedKey = useMemo(() => {
		if (currentRoute?.label && currentRoute.path) return currentRoute.path;
		let bestMatch: string | null = null;
		let maxLen = 0;
		const findBest = (list: RouteDef[]) => {
			for (const r of list) {
				if (r.path && pathname.startsWith(r.path) && r.path.length > maxLen) {
					bestMatch = r.path;
					maxLen = r.path.length;
				}
				if (r.subMenu) findBest(r.subMenu);
			}
		};
		findBest(menuRoutes);
		return bestMatch || pathname;
	}, [pathname, currentRoute, menuRoutes]);

	useEffect(() => {
		if (collapsed) return;
		for (const r of menuRoutes) {
			if (r.subMenu && r.subMenu.some((c) => c.path && (pathname === c.path || pathname.startsWith(`${c.path}/`)))) {
				const parentKey = `sub-${r.path || r.label}`;
				setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
				break;
			}
		}
	}, [pathname, collapsed, menuRoutes]);

	const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
		setOpenKeys(keys as string[]);
	};

	return (
		<Sider
			width={250}
			collapsedWidth={80}
			collapsible
			collapsed={collapsed}
			onCollapse={toggleCollapsed}
			trigger={null}
			theme={isDark ? 'dark' : 'light'}
			className="cms-sidebar"
			style={{
				height: '100vh',
				background: token.colorBgContainer,
				borderRight: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '2px 0 10px rgba(0, 0, 0, 0.02)',
			}}
		>
			<Flex
				align="center"
				justify={collapsed ? 'center' : 'flex-start'}
				gap={10}
				style={{
					height: 64,
					padding: collapsed ? '0' : '0 20px',
					borderBottom: `1px solid ${token.colorBorderSecondary}`,
					cursor: 'pointer',
				}}
				onClick={() => navigate('/dashboard')}
			>
				<div
					style={{
						width: 34,
						height: 34,
						borderRadius: 8,
						background: 'linear-gradient(135deg, #EC008C 0%, #6B217F 100%)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: '#fff',
						fontWeight: 800,
						fontSize: 16,
						boxShadow: '0 4px 10px rgba(236, 0, 140, 0.3)',
					}}
				>
					T
				</div>
				{!collapsed && (
					<Flex vertical>
						<span style={{ fontWeight: 700, fontSize: 15, color: token.colorText, lineHeight: 1.2 }}>TikTok Crawler</span>
						<span style={{ fontSize: 11, color: token.colorTextSecondary }}>CMS Management</span>
					</Flex>
				)}
			</Flex>

			<Menu
				mode="inline"
				selectedKeys={[selectedKey]}
				openKeys={collapsed ? [] : openKeys}
				onOpenChange={onOpenChange}
				items={menuItems}
				style={{
					borderRight: 0,
					padding: collapsed ? '12px 6px' : '12px 10px',
					background: 'transparent',
				}}
			/>
		</Sider>
	);
}
