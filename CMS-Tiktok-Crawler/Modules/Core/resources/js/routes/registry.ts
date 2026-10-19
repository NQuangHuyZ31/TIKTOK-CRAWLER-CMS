import { useSyncExternalStore, type ComponentType, type ReactNode } from 'react';

export interface RouteDef {
    /** Absolute path starting with '/', e.g. '/dashboard', '/crawler/crawl-job' */
    path: string;
    /** Component to render */
    component: ComponentType<any>;
    /** 'main' (wrapped in MainLayout) | 'bare' (full screen, no layout) */
    layout?: 'main' | 'bare' | 'none';
    /** Whether the route requires authentication / private (default true) */
    isPrivate?: boolean;
    /** Page title */
    title?: string;
    /** Label to show in menu (routes without label are routed but not shown in menu) */
    label?: string;
    /** Icon for navigation menu */
    icon?: ComponentType<any> | ReactNode;
    /** Sort order in menu (default 100) */
    order?: number;
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
 * Register a single route into the Core Route Registry.
 * If a route with the same path already exists, it will be updated/overwritten.
 */
export function registerRoute(def: RouteDef): void {
    const r = registry();
    const cleanPath = def.path.startsWith('/') ? def.path : `/${def.path}`;
    const normalized: RouteDef = {
        layout: 'main',
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
 * Get only public (bare/unprotected) routes.
 */
export function getPublicRoutes(): RouteDef[] {
    return registry().routes.filter((r) => r.isPrivate === false || r.layout === 'bare');
}

/**
 * Get only private (layout-wrapped) routes.
 */
export function getPrivateRoutes(): RouteDef[] {
    return registry().routes.filter((r) => r.isPrivate !== false && r.layout !== 'bare');
}
