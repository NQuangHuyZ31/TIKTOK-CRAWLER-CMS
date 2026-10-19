import { initRouteRegistry } from './autoRegister';
import { getRoutes, getPublicRoutes, getPrivateRoutes } from './registry';

// Initialize auto-registration immediately
initRouteRegistry();

export * from './registry';
export * from './autoRegister';

// Export publicRoutes and privateRoutes getters for backward compatibility
export const publicRoutes = getPublicRoutes();
export const privateRoutes = getPrivateRoutes();

export default getRoutes;
