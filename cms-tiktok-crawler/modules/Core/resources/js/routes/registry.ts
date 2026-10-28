import { PermissionAction } from '../hooks/usePermission';
import { useMemo, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

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

/**
 * Check whether a route belongs to AdminLayout.
 */
export function isAdminRoute(route: RouteDef): boolean {
    return route.layout !== 'bare' && route.layout !== 'none' && route.isPrivate !== false;
}

/**
 * Register a single route into the Core Route Registry.
 * If a route with the same path already exists, it will be updated/overwritten.
 */
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

/**
 * Register multiple routes into the Core Route Registry.
 */
export function registerRoutes(defs: RouteDef[]): void {
    defs.forEach(registerRoute);
}

/**
 * Get snapshot list of all registered routes.
 */
export function getRoutes(): readonly RouteDef[] {
    return registry().routes;
}

/**
 * React 18 hook to reactively listen to registered routes (uses useSyncExternalStore).
 */
export function useRoutes(): readonly RouteDef[] {
    return useSyncExternalStore(subscribe, () => registry().routes);
}

/**
 * Get only admin (AdminLayout-wrapped) routes.
 */
export function getAdminRoutes(): RouteDef[] {
    return registry().routes.filter(isAdminRoute);
}

/**
 * Get only public or bare routes (not wrapped in AdminLayout).
 */
export function getPublicRoutes(): RouteDef[] {
    return registry().routes.filter((r) => !isAdminRoute(r));
}

/**
 * Alias for getAdminRoutes for backward compatibility.
 */
export function getPrivateRoutes(): RouteDef[] {
    return getAdminRoutes();
}

/**
 * Get routes configured for sidebar navigation menu.
 */
export function getMenuRoutes(): RouteDef[] {
    return registry()
        .routes.filter((r) => Boolean(r.label) && isAdminRoute(r))
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

/**
 * React hook to reactively get admin routes.
 */
export function useAdminRoutes(): readonly RouteDef[] {
    const routes = useRoutes();
    return routes.filter(isAdminRoute);
}

/**
 * React hook to reactively get bare/public routes.
 */
export function useBareRoutes(): readonly RouteDef[] {
    const routes = useRoutes();
    return routes.filter((r) => !isAdminRoute(r));
}

function buildMenuTree(routes: readonly RouteDef[]): RouteDef[] {
    const menuOnly = routes.filter((r) => Boolean(r.label) && isAdminRoute(r));

    const itemMap = new Map<string, RouteDef>();
    const rootNodes: RouteDef[] = [];

    // Clone dữ liệu để tránh mutate mảng gốc
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

/**
 * React hook to reactively resolve the active RouteDef matching the current pathname.
 * Handles exact matching first, then longest matching prefix (e.g. for /crawler/crawl-job/1/edit).
 */
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

/**
 * React hook to reactively get sidebar navigation menu routes (memoized).
 */
export function useMenuRoutes(): RouteDef[] {
    const routes = useRoutes();
    return useMemo(() => buildMenuTree(routes), [routes]);
}
