import type { RouteDef } from '@core/routes/registry';
import LoginPage from '../pages/LoginPage';
// import ProfilePage from '../pages/ProfilePage';

const authRoutes: RouteDef[] = [
    {
        path: '/auth/login',
        component: LoginPage,
        layout: 'bare',
        isPrivate: false,
        title: 'Sign In',
        order: 900,
    },
];

export default authRoutes;
