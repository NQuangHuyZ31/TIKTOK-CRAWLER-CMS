/**
 * Entry point for Crawler module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import crawlerRoutes from './routes/route';

// Tự động đăng ký routes vào Core khi file script được load trên DOM
registerRoutes(crawlerRoutes);

export default crawlerRoutes;
export * from './routes/route';
export * from './Action/crawlJob';
export * from './Action/crawlResult';
