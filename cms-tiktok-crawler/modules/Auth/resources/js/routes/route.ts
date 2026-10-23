import { UserOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import LoginPage from '../pages/LoginPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
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
    {
        path: '/auth/reset-password',
        component: ResetPasswordPage,
        layout: 'bare',
        isPrivate: false,
        title: 'Reset Password',
        order: 902,
    },
];

export default authRoutes;
