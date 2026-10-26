/**
 * Entry point for User & Access Management module.
 * Registers module routes into Core Route Registry upon script load in DOM.
 */
import { registerRoutes } from '@core/routes/registry';
import userRoutes from './routes/route';

// Automatically register routes into Core Route Registry
registerRoutes(userRoutes);

export default userRoutes;
export * from './routes/route';
export * from './Action/user';
export { default as userAPI } from './Action/user';
export { default as UserListPage } from './pages/UserListPage';
export { default as UserDetailPage } from './pages/UserDetailPage';
export { default as UserFormPage } from './pages/UserFormPage';
