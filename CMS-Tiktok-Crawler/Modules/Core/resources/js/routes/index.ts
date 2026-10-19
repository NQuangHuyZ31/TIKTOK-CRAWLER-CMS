import ModuleRoute from './moduleRoutes';
import NotFound from '../pages/NotFound';
import DashboardPage from '../pages/DashboardPage';

const publicRoutes = [
	{
		path: '/404',
		component: NotFound
	}
];

const privateRoutes = [
	{
		path: '/dashboard',
		component: DashboardPage
	},
	...ModuleRoute
];

export { publicRoutes, privateRoutes };
