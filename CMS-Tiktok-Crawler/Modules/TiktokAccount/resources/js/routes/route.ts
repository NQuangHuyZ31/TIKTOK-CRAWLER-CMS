import TiktokAccountPage from '../pages/TiktokAccountPage';
import TiktokAccountDetailPage from '../pages/TiktokAccountDetailPage';
import TiktokAccountEditPage from '../pages/TiktokAccountEditPage';

const tiktokAccountRoutes = [
	{
		path: '/tiktok-account',
		component: TiktokAccountPage
	},
	{
		path: '/tiktok-account/:id',
		component: TiktokAccountDetailPage
	},
	{
		path: '/tiktok-account/:id/edit',
		component: TiktokAccountEditPage
	}
];

export default tiktokAccountRoutes;