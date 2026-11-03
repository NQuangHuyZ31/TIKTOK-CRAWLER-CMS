import { useMemo, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteDef, isAdminRoute } from './routeTypes';
import { buildMenuTree } from './buildMenuTree';

export type { RouteDef };
export { isAdminRoute };

type RegistryState = {
	routes: readonly RouteDef[];
	listeners: Set<() => void>;
};

const registry = (): RegistryState => {
	const w = window as unknown as { __CMS_ROUTES_REGISTRY__?: RegistryState };
	return (w.__CMS_ROUTES_REGISTRY__ ??= { routes: [], listeners: new Set() });
};

const emit = () => {
	registry().listeners.forEach((listener) => listener());
};

export const subscribe = (listener: () => void) => {
	const r = registry();
	r.listeners.add(listener);
	return () => r.listeners.delete(listener);
};

export function registerRoute(def: RouteDef): void {
	const r = registry();
	const cleanPath = def.path.startsWith('/') ? def.path : `/${def.path}`;
	const normalized: RouteDef = {
		layout: 'admin',
		isPrivate: true,
		order: 100,
		...def,
		path: cleanPath,
	};
	r.routes = [...r.routes.filter((route) => route.path !== cleanPath), normalized].sort(
		(a, b) => (a.order ?? 100) - (b.order ?? 100)
	);
	emit();
}

export function registerRoutes(defs: RouteDef[]): void {
	defs.forEach(registerRoute);
}

export function getRoutes(): readonly RouteDef[] {
	return registry().routes;
}

export function useRoutes(): readonly RouteDef[] {
	return useSyncExternalStore(subscribe, () => registry().routes);
}

export function getAdminRoutes(): RouteDef[] {
	return registry().routes.filter(isAdminRoute);
}

export function getPublicRoutes(): RouteDef[] {
	return registry().routes.filter((r) => !isAdminRoute(r));
}

export function getPrivateRoutes(): RouteDef[] {
	return getAdminRoutes();
}

export function getMenuRoutes(): RouteDef[] {
	return registry()
		.routes.filter((r) => Boolean(r.label) && isAdminRoute(r))
		.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function useAdminRoutes(): readonly RouteDef[] {
	const routes = useRoutes();
	return routes.filter(isAdminRoute);
}

export function useBareRoutes(): readonly RouteDef[] {
	const routes = useRoutes();
	return routes.filter((r) => !isAdminRoute(r));
}

export function useCurrentRoute(): RouteDef | undefined {
	const routes = useRoutes();
	const location = useLocation();

	return useMemo(() => {
		const pathname = location.pathname;
		const exact = routes.find((r) => r.path === pathname);
		if (exact) return exact;

		let bestMatch: RouteDef | undefined;
		let maxLen = 0;
		for (const r of routes) {
			if (r.path && pathname.startsWith(r.path) && r.path.length > maxLen) {
				bestMatch = r;
				maxLen = r.path.length;
			}
		}
		return bestMatch;
	}, [routes, location.pathname]);
}

export function useMenuRoutes(): RouteDef[] {
	const routes = useRoutes();
	return useMemo(() => buildMenuTree(routes), [routes]);
}
