import React, { isValidElement, useEffect, useMemo, useState } from 'react';
import { Button, Flex, Layout, Menu, Tag, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AppstoreOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined, RobotOutlined, SafetyCertificateOutlined, SettingOutlined, TeamOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useMenuRoutes, useCurrentRoute, type RouteDef } from '../routes/registry';
import { useLayout } from '../contexts/LayoutContext';
import usePermission from '../hooks/usePermission';

const { Sider } = Layout;

/**
 * Intelligent icon resolver providing rich, consistent icons across all module routes.
 */
function resolveMenuIcon(item: RouteDef): React.ReactNode {
	if (item.icon) {
		if (isValidElement(item.icon)) {
			return item.icon;
		}
		if (typeof item.icon === 'function') {
			const IconComponent = item.icon as React.ComponentType;
			return <IconComponent />;
		}
	}

	const path = (item.path || '').toLowerCase();
	if (path.includes('dashboard')) return <DashboardOutlined />;
	if (path.includes('crawler') || path.includes('crawl')) return <RobotOutlined />;
	if (path.includes('tiktok')) return <VideoCameraOutlined />;
	if (path.includes('user')) return <TeamOutlined />;
	if (path.includes('role') || path.includes('permission')) return <SafetyCertificateOutlined />;
	if (path.includes('system') || path.includes('setting')) return <SettingOutlined />;
	if (path.includes('profile')) return <UserOutlined />;

	return <AppstoreOutlined />;
}

export default function Sidebar() {
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const menuRoutes = useMenuRoutes();
	const currentRoute = useCurrentRoute();
	const { collapsed, toggleCollapsed, setCollapsed } = useLayout();
	const { isAdmin, canDoModule, hasRole } = usePermission();

	const [openKeys, setOpenKeys] = useState<string[]>([]);

	// Transform pre-built menu tree into Ant Design Menu items with permission check
	const menuItems = useMemo(() => {
		const isAccessible = (route: RouteDef): boolean => {
			if (isAdmin) return true;
			if (route.roles && !hasRole(route.roles)) return false;
			if (route.module && !canDoModule(route.module, 'view')) return false;
			return true;
		};

		const transformRoutes = (routes: RouteDef[]): any[] => {
			const items: any[] = [];

			for (const route of routes) {
				const hasChildren = Boolean(route.subMenu && route.subMenu.length > 0);

				if (hasChildren) {
					const accessibleChildren = transformRoutes(route.subMenu!);
					if (accessibleChildren.length > 0) {
						// Determine if current pathname matches the parent route specifically
						const isChildActive = route.subMenu!.some((child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`)));
						const isParentActive = Boolean(route.path && (pathname === route.path || pathname.startsWith(`${route.path}/`)) && !isChildActive);

						items.push({
							key: `sub-${route.path || route.label}`,
							className: isParentActive ? 'cms-parent-active' : undefined,
							icon: resolveMenuIcon(route),
							label: route.path ? (
								<NavLink
									to={route.path}
									style={{ display: 'inline-block', width: '100%', color: 'inherit' }}
									onClick={(e) => {
										// Prevent Ant Design from closing the submenu when clicking the link text
										e.stopPropagation();
										const parentKey = `sub-${route.path || route.label}`;
										setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
									}}
								>
									{route.label}
								</NavLink>
							) : (
								route.label
							),
							onTitleClick: ({ domEvent }: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
								if (!route.path || collapsed) return;
								const target = domEvent.target as HTMLElement | null;
								// If user clicked specifically on the expand/collapse arrow, let Ant Design toggle open/close
								if (target?.closest('.ant-menu-submenu-arrow')) {
									return;
								}
								// Otherwise (clicked on icon, padding, or title), navigate to parent path
								if (pathname !== route.path) {
									navigate(route.path);
								}
								const parentKey = `sub-${route.path || route.label}`;
								setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
							},
							children: accessibleChildren,
						});
					}
					continue;
				}

				if (isAccessible(route)) {
					items.push({
						key: route.path,
						icon: resolveMenuIcon(route),
						label: (
							<NavLink
								to={route.path!}
								style={{ display: 'inline-block', width: '100%', color: 'inherit' }}
								onClick={(e) => {
									e.stopPropagation();
								}}
							>
								{route.label}
							</NavLink>
						),
					});
				}
			}

			return items;
		};

		return transformRoutes(menuRoutes);
	}, [menuRoutes, isAdmin, hasRole, canDoModule, pathname, collapsed, navigate]);

	// Auto-calculate best matching selected key using current route or longest prefix
	const selectedKey = useMemo(() => {
		if (currentRoute?.label && currentRoute.path) {
			return currentRoute.path;
		}

		let bestMatch: string | null = null;
		let maxLen = 0;

		const findBest = (list: RouteDef[]) => {
			for (const r of list) {
				if (r.path && pathname.startsWith(r.path) && r.path.length > maxLen) {
					bestMatch = r.path;
					maxLen = r.path.length;
				}
				if (r.subMenu) {
					findBest(r.subMenu);
				}
			}
		};

		findBest(menuRoutes);
		return bestMatch || pathname;
	}, [pathname, currentRoute, menuRoutes]);

	// Auto-expand active parent SubMenu
	useEffect(() => {
		menuRoutes.forEach((parent) => {
			if (parent.subMenu && parent.subMenu.length > 0) {
				const isCurrentParent = Boolean(parent.path && (pathname === parent.path || pathname.startsWith(`${parent.path}/`)));
				const hasActiveChild = parent.subMenu.some((child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`)));
				if (isCurrentParent || hasActiveChild) {
					const parentKey = `sub-${parent.path || parent.label}`;
					setOpenKeys((prev) => Array.from(new Set([...prev, parentKey])));
				}
			}
		});
	}, [pathname, menuRoutes]);

	const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
		if (key && !key.startsWith('sub-')) {
			navigate(key);
		}
	};

	return (
		<Sider
			theme="light"
			collapsible
			collapsed={collapsed}
			onCollapse={(val) => setCollapsed(val)}
			trigger={null}
			width={240}
			collapsedWidth={64}
			className="cms-sidebar"
			style={{
				height: '100vh',
				background: '#ffffff',
				borderRight: '1px solid #edf0f5',
				boxShadow: '1px 0 6px rgba(16, 24, 40, 0.03)',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				zIndex: 20,
				transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
			}}
		>
			<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* Brand Logo Header */}
				<div
					style={{
						height: 70,
						display: 'flex',
						alignItems: 'center',
						justifyContent: collapsed ? 'center' : 'flex-start',
						padding: collapsed ? '0' : '0 18px',
						gap: 12,
						borderBottom: '1px solid #edf0f5',
						cursor: 'pointer',
					}}
					onClick={() => navigate('/dashboard')}
				>
					<Tooltip title={collapsed ? 'TikTok Crawler CMS' : undefined} placement="right">
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: 10,
								background: 'linear-gradient(135deg, #1677ff 0%, #36cfc9 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: '#ffffff',
								fontSize: 18,
								flexShrink: 0,
								boxShadow: '0 4px 10px rgba(22, 119, 255, 0.2)',
							}}
						>
							<RobotOutlined />
						</div>
					</Tooltip>
					{!collapsed && (
						<div style={{ minWidth: 0 }}>
							<div style={{ fontWeight: 700, fontSize: 15, color: '#101828', lineHeight: 1.25, whiteSpace: 'nowrap' }}>TikTok Crawler</div>
							<Flex align="center" gap={6} style={{ marginTop: 2 }}>
								<span style={{ fontSize: 10, fontWeight: 700, color: '#667085', letterSpacing: '0.06em' }}>CMS PANEL</span>
								<Tag color="blue" bordered={false} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 5px', borderRadius: 4, fontWeight: 600 }}>
									v1.0
								</Tag>
							</Flex>
						</div>
					)}
				</div>

				{/* Navigation Menu */}
				<div
					className="cms-sidebar-menu"
					style={{
						flex: 1,
						overflowY: 'auto',
						overflowX: 'hidden',
						padding: collapsed ? '12px 4px' : '12px 8px',
					}}
				>
					<Menu
						mode="inline"
						selectedKeys={selectedKey ? [selectedKey] : []}
						openKeys={collapsed ? [] : openKeys}
						onOpenChange={(keys) => setOpenKeys(keys)}
						onClick={handleMenuClick}
						items={menuItems}
						inlineCollapsed={collapsed}
						style={{
							borderRight: 'none',
							background: 'transparent',
							fontWeight: 500,
						}}
					/>
				</div>
			</div>
		</Sider>
	);
}
