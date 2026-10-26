import { SafetyCertificateOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import RolesPage from '../pages/RolesPage';

const roleRoutes: RouteDef[] = [
    {
        path: '/user/role',
        component: RolesPage,
        layout: 'admin',
        parentPath: '/user',
        module: 'role',
        action: 'view',
        label: 'Roles & Access',
        icon: SafetyCertificateOutlined,
        order: 1,
    },
];

export default roleRoutes;
