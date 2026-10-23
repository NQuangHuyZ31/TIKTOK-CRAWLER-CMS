/**
 * Entry point for Auth module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import authRoutes from './routes/route';

// Auto register routes into Core Route Registry
registerRoutes(authRoutes);

export default authRoutes;
export * from './routes/route';
export * from './Action/auth';
export * from './configs/authConfig';
export { default as authReducer } from './store/auth/authSlice';
export * from './store/auth/authSlice';
export * from './store/auth/authThunks';
