import { initRouteRegistry } from './autoRegister';
import { getRoutes, getPublicRoutes, getPrivateRoutes, getAdminRoutes, getMenuRoutes } from './registry';

// Initialize auto-registration immediately
initRouteRegistry();

export * from './registry';
export * from './autoRegister';

// Export route getters for backward compatibility
export const publicRoutes = getPublicRoutes();
export const privateRoutes = getPrivateRoutes();
export const adminRoutes = getAdminRoutes();
export const menuRoutes = getMenuRoutes();

export default getRoutes;
