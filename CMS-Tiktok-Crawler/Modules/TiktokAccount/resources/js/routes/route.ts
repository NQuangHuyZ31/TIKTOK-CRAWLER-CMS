import { lazy } from 'react';
import { UserOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';

const TiktokAccountPage = lazy(() => import('../pages/TiktokAccountPage'));
const TiktokAccountDetailPage = lazy(() => import('../pages/TiktokAccountDetailPage'));
const TiktokAccountEditPage = lazy(() => import('../pages/TiktokAccountEditPage'));

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