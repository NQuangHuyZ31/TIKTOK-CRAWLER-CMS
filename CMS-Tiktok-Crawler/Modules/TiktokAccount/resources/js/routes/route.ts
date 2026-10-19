import TiktokAccountPage from '../pages/TiktokAccountPage';
import TiktokAccountDetailPage from '../pages/TiktokAccountDetailPage';
import TiktokAccountEditPage from '../pages/TiktokAccountEditPage';
import type { RouteDef } from '../../../../Core/resources/js/routes/registry';

const tiktokAccountRoutes: RouteDef[] = [
    {
        path: '/tiktok-account',
        component: TiktokAccountPage,
        title: 'TikTok Accounts',
        label: 'TikTok Accounts',
        order: 20,
    },
    {
        path: '/tiktok-account/:id',
        component: TiktokAccountDetailPage,
        title: 'TikTok Account Details',
    },
    {
        path: '/tiktok-account/:id/edit',
        component: TiktokAccountEditPage,
        title: 'Edit TikTok Account',
    },
];

export default tiktokAccountRoutes;
