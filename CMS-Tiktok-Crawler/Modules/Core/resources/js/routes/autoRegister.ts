import { DashboardOutlined } from '@ant-design/icons';
import { registerRoute, registerRoutes, type RouteDef } from './registry';
import NotFound from '../pages/NotFound';
import DashboardPage from '../pages/DashboardPage';

let initialized = false;

/**
 * Initializes Core default routes and auto-discovers route definitions from all modules.
 */
export function initRouteRegistry(): void {
    if (initialized) return;
    initialized = true;

    // 1. Register Core built-in routes
    registerRoute({
        path: '/404',
        component: NotFound,
        layout: 'bare',
        isPrivate: false,
        title: 'Not Found',
        order: 999,
    });

    registerRoute({
        path: '/dashboard',
        component: DashboardPage,
        layout: 'admin',
        isPrivate: true,
        title: 'Dashboard',
        label: 'Dashboard',
        icon: DashboardOutlined,
        order: 0,
    });

    // 2. Auto-discover all module route definitions if running under Vite (in Mix, modules register via DOM scripts)
    try {
        if (typeof import.meta !== 'undefined' && typeof (import.meta as any).glob === 'function') {
            const modules = (import.meta as any).glob(
                ['/Modules/**/resources/js/routes/route.{ts,tsx}', '/modules/**/resources/js/routes/route.{ts,tsx}'],
                { eager: true }
            );

            for (const path in modules) {
                const mod = modules[path];
                if (mod && mod.default) {
                    if (Array.isArray(mod.default)) {
                        registerRoutes(mod.default);
                    } else if (typeof mod.default === 'object' && 'path' in mod.default) {
                        registerRoute(mod.default as RouteDef);
                    }
                }
            }
        }
    } catch (e) {
        console.warn('[RouteRegistry] Auto-registration encountered an issue:', e);
    }
}
