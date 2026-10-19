import TiktokAccountPage from '@modules/TiktokAccount/resources/js/pages/TiktokAccountPage';
import TiktokAccountDetailPage from '@modules/TiktokAccount/resources/js/pages/TiktokAccountDetailPage';
import TiktokAccountEditPage from '@modules/TiktokAccount/resources/js/pages/TiktokAccountEditPage';

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