import ModuleRoute from './moduleRoutes.js'
import NotFound from '../pages/NotFound.jsx'

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