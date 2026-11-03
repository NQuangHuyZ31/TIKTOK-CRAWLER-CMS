import { isAdminRoute, type RouteDef } from './routeTypes';

export function buildMenuTree(routes: readonly RouteDef[]): RouteDef[] {
	const menuOnly = routes.filter((r) => Boolean(r.label) && isAdminRoute(r));

	const itemMap = new Map<string, RouteDef>();
	const rootNodes: RouteDef[] = [];

	menuOnly.forEach((item) => {
		itemMap.set(item.path, { ...item, subMenu: item.subMenu ? [...item.subMenu] : [] });
	});

	itemMap.forEach((node) => {
		if (node.parentPath && node.parentPath !== node.path && itemMap.has(node.parentPath)) {
			const parent = itemMap.get(node.parentPath)!;
			parent.subMenu = parent.subMenu ?? [];
			if (!parent.subMenu.some((c) => c.path === node.path)) {
				parent.subMenu.push(node);
				parent.subMenu.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
			}
		} else {
			rootNodes.push(node);
		}
	});

	return rootNodes.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
