import { KeyOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import PermissionsPage from '../pages/PermissionsPage';

const permissionRoutes: RouteDef[] = [
    {
        path: '/user/permission',
        component: PermissionsPage,
        layout: 'admin',
        parentPath: '/user',
        module: 'permission',
        action: 'view',
        label: 'Permissions',
        icon: KeyOutlined,
        order: 2,
    },
];

export default permissionRoutes;
