/**
 * Entry point for User & Access Management module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import userRoutes from './routes/route';

// Automatically register routes into Core Route Registry
registerRoutes(userRoutes);
