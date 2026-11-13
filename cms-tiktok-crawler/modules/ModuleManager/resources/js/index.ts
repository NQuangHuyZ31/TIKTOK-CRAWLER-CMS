/**
 * Entry point for ModuleManager module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import moduleManagerRoutes from './routes/route';

registerRoutes(moduleManagerRoutes);
