/**
 * Entry point for TiktokAccount module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import tiktokAccountRoutes from './routes/route';

// Automatically register routes into Core when the script is loaded in DOM
registerRoutes(tiktokAccountRoutes);
