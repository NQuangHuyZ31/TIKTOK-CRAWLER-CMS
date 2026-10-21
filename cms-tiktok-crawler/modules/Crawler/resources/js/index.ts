/**
 * Entry point for Crawler module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import crawlerRoutes from './routes/route';

// Auto register routes into Core Route Registry
registerRoutes(crawlerRoutes);

export default crawlerRoutes;
export * from './routes/route';
export * from './Action/crawlJob';
