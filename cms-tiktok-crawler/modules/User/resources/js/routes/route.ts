import { TeamOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import UserListPage from '../pages/UserListPage';
import UserDetailPage from '../pages/UserDetailPage';
import UserFormPage from '../pages/UserFormPage';

const userRoutes: RouteDef[] = [
    {
        path: '/user',
        component: UserListPage,
        layout: 'admin',
        module: 'user',
        action: 'view',
        title: 'Users',
        label: 'Users',
        icon: TeamOutlined,
        order: 30,
    },
    {
        path: '/user/create',
        component: UserFormPage,
        layout: 'admin',
        module: 'user',
        action: 'create',
    },
    {
        path: '/user/:id',
        component: UserDetailPage,
        layout: 'admin',
        module: 'user',
        action: 'view',
    },
    {
        path: '/user/:id/edit',
        component: UserFormPage,
        layout: 'admin',
        module: 'user',
        action: 'edit',
    },
];

export default userRoutes;
