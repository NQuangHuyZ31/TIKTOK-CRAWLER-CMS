import ModuleRoute from './moduleRoutes'
import NotFound from '../pages/NotFound'

const publicRoutes = [
	{
		path: '/404',
		component: NotFound
	}
];

const privateRoutes = [
	...ModuleRoute
];

export { publicRoutes, privateRoutes };