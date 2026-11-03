import React, { isValidElement } from 'react';
import { NavLink, NavigateFunction } from 'react-router-dom';
import {
	AppstoreOutlined,
	DashboardOutlined,
	KeyOutlined,
	RobotOutlined,
	SafetyCertificateOutlined,
	SettingOutlined,
	TeamOutlined,
	UserOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import type { RouteDef } from '../../routes/registry';

export function resolveMenuIcon(item: RouteDef): React.ReactNode {
	if (item.icon) {
		if (isValidElement(item.icon)) return item.icon;
		const IconComponent = item.icon as any;
		try {
			return <IconComponent />;
		} catch {
			// fallback below
		}
	}
	const path = (item.path || '').toLowerCase();
	if (path.includes('dashboard')) return <DashboardOutlined />;
	if (path.includes('crawler') || path.includes('crawl')) return <RobotOutlined />;
	if (path.includes('tiktok')) return <VideoCameraOutlined />;
	if (path.includes('permission')) return <KeyOutlined />;
	if (path.includes('role')) return <SafetyCertificateOutlined />;
	if (path.includes('user')) return <TeamOutlined />;
	if (path.includes('system') || path.includes('setting')) return <SettingOutlined />;
	if (path.includes('profile')) return <UserOutlined />;
	return <AppstoreOutlined />;
}

export function buildSidebarMenuItems({
	routes,
	isAdmin,
	can,
	pathname,
	collapsed,
	navigate,
	setOpenKeys,
}: {
	routes: RouteDef[];
	isAdmin: boolean;
	can: (params: any) => boolean;
	pathname: string;
	collapsed: boolean;
	navigate: NavigateFunction;
	setOpenKeys: React.Dispatch<React.SetStateAction<string[]>>;
}): any[] {
	const isAccessible = (route: RouteDef): boolean => {
		if (isAdmin) return true;
		return can({ role: route.roles, slug: route.slug, module: route.module, action: route.action || 'view' });
	};

	const transform = (list: RouteDef[]): any[] => {
		const items: any[] = [];
		for (const route of list) {
			const hasChildren = Boolean(route.subMenu && route.subMenu.length > 0);
			const accessibleChildren = hasChildren ? transform(route.subMenu!) : [];

			if (collapsed) {
				if (isAccessible(route) && route.path) {
					items.push({
						key: route.path,
						title: route.label,
						icon: resolveMenuIcon(route),
						label: <NavLink to={route.path} style={{ display: 'inline-block', width: '100%', color: 'inherit' }} onClick={(e) => e.stopPropagation()}>{route.label}</NavLink>,
					});
				}
				if (accessibleChildren.length > 0) items.push(...accessibleChildren);
				continue;
			}

			if (accessibleChildren.length > 0) {
				const isChildActive = route.subMenu!.some((child) => child.path && (pathname === child.path || pathname.startsWith(`${child.path}/`)));
				const isParentActive = Boolean(route.path && (pathname === route.path || pathname.startsWith(`${route.path}/`)) && !isChildActive);
				const parentAccessible = isAccessible(route);

				items.push({
					key: `sub-${route.path || route.label}`,
					title: route.label,
					className: isParentActive ? 'cms-parent-active' : undefined,
					icon: resolveMenuIcon(route),
					label: route.path && parentAccessible ? (
						<NavLink
							to={route.path}
							style={{ display: 'inline-block', width: '100%', color: 'inherit' }}
							onClick={(e) => {
								e.stopPropagation();
								const parentKey = `sub-${route.path || route.label}`;
								setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
							}}
						>
							{route.label}
						</NavLink>
					) : route.label,
					onTitleClick: ({ domEvent }: { domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> }) => {
						if (!route.path || !parentAccessible) return;
						const target = domEvent.target as HTMLElement | null;
						if (target?.closest('.ant-menu-submenu-arrow')) return;
						if (pathname !== route.path) navigate(route.path);
						const parentKey = `sub-${route.path || route.label}`;
						setOpenKeys((prev) => (prev.includes(parentKey) ? prev : [...prev, parentKey]));
					},
					children: accessibleChildren,
				});
				continue;
			}

			if (isAccessible(route) && route.path) {
				items.push({
					key: route.path,
					title: route.label,
					icon: resolveMenuIcon(route),
					label: <NavLink to={route.path} style={{ display: 'inline-block', width: '100%', color: 'inherit' }} onClick={(e) => e.stopPropagation()}>{route.label}</NavLink>,
				});
			}
		}
		return items;
	};

	return transform(routes);
}
