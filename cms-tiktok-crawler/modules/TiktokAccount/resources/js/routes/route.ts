import { UserOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import TiktokAccountPage from '../pages/TiktokAccountPage';
import TiktokAccountDetailPage from '../pages/TiktokAccountDetailPage';
import TiktokAccountEditPage from '../pages/TiktokAccountEditPage';

const tiktokAccountRoutes: RouteDef[] = [
    {
        path: '/tiktok-account',
        component: TiktokAccountPage,
        layout: 'admin',
        title: 'TikTok Accounts',
        label: 'TikTok Accounts',
        icon: UserOutlined,
        order: 20,
    },
    {
        path: '/tiktok-account/:id',
        component: TiktokAccountDetailPage,
        layout: 'admin',
        title: 'TikTok Account Details',
    },
    {
        path: '/tiktok-account/:id/edit',
        component: TiktokAccountEditPage,
        layout: 'admin',
        title: 'Edit TikTok Account',
    },
];

export default tiktokAccountRoutes;