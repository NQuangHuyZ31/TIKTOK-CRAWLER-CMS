import { VideoCameraOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import TiktokAccountPage from '../pages/TiktokAccountPage';
import TiktokAccountDetailPage from '../pages/TiktokAccountDetailPage';
import TiktokAccountFormPage from '../pages/TiktokAccountFormPage';

const tiktokAccountRoutes: RouteDef[] = [
    {
        path: '/tiktok-account',
        component: TiktokAccountPage,
        layout: 'admin',
        title: 'TikTok Accounts',
        label: 'TikTok Accounts',
        module: 'tiktok_account',
        action: 'view',
        icon: VideoCameraOutlined,
        order: 20,
    },
    {
        path: '/tiktok-account/:id',
        component: TiktokAccountDetailPage,
        layout: 'admin',
        title: 'TikTok Account Details',
        module: 'tiktok_account',
        action: 'view',
    },
    {
        path: '/tiktok-account/create',
        component: TiktokAccountFormPage,
        layout: 'admin',
        title: 'Create TikTok Account',
        module: 'tiktok_account',
        action: 'create',
    },
    {
        path: '/tiktok-account/:id/edit',
        component: TiktokAccountFormPage,
        layout: 'admin',
        title: 'Edit TikTok Account',
        module: 'tiktok_account',
        action: 'edit',
    },
];

export default tiktokAccountRoutes;