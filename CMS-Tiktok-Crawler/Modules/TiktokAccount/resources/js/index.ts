/**
 * Entry point for TiktokAccount module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import tiktokAccountRoutes from './routes/route';

// Tự động đăng ký routes vào Core khi file script được load trên DOM
registerRoutes(tiktokAccountRoutes);

export default tiktokAccountRoutes;
export * from './routes/route';
export * from './Action/tiktokAccount';
