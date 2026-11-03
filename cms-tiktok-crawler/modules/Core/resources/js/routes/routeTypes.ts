import type { ComponentType, ReactNode } from 'react';
import type { PermissionAction } from '../hooks/usePermission';

export interface RouteDef {
	/** Absolute path starting with '/', e.g. '/dashboard', '/crawler/crawl-job' */
	path: string;
	/** Component to render */
	component: ComponentType<any>;
	/** 'admin' (wrapped in AdminLayout) | 'main' (alias for admin) | 'bare' (full screen, no layout) | 'none' */
	layout?: 'admin' | 'main' | 'bare' | 'none';
	/** Whether the route requires authentication / private (default true) */
	isPrivate?: boolean;
	/** Page title */
	title?: string;
	/** Label to show in navigation menu (routes without label are routed but not shown in sidebar menu) */
	label?: string;
	/** Icon for navigation menu */
	icon?: ComponentType<any> | ReactNode;
	/** Sort order in menu (default 100) */
	order?: number;
	/** Module can check permission */
	module?: string;
	/** Action can check permission */
	action?: PermissionAction;
	/** Role required to access the route */
	roles?: string[];
	/** Slug used to check permission */
	slug?: string;
	/** subMenu option 1 */
	parentPath?: string;
	/** subMenu option 2 */
	subMenu?: RouteDef[];
	/** Additional metadata */
	meta?: Record<string, any>;
}

export function isAdminRoute(route: RouteDef): boolean {
	return route.layout !== 'bare' && route.layout !== 'none' && route.isPrivate !== false;
}
