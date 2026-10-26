/**
 * Entry point for Role module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import roleRoutes from './routes/route';

// Auto register routes into Core Route Registry
registerRoutes(roleRoutes);
