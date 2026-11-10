/**
 * Entry point for Guideline module.
 * Registers standalone public guideline routes into Core Route Registry.
 */
import { registerRoutes } from '@core/routes/registry';
import guidelineRoutes from './routes/route';

// Auto register routes into Core Route Registry
registerRoutes(guidelineRoutes);
