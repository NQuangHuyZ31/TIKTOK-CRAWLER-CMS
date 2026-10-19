import { lazy } from 'react';
import type { RouteDef } from '../../../../Core/resources/js/routes/registry';

const TiktokAccountPage = lazy(() => import('../pages/TiktokAccountPage'));
const TiktokAccountDetailPage = lazy(() => import('../pages/TiktokAccountDetailPage'));
const TiktokAccountEditPage = lazy(() => import('../pages/TiktokAccountEditPage'));

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