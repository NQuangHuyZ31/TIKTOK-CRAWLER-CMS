import { SettingOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import SystemSettingsPage from '../pages/SystemSettingsPage';

const systemRoutes: RouteDef[] = [
    {
        path: '/system/settings',
        component: SystemSettingsPage,
        layout: 'admin',
        title: 'System Settings',
        label: 'System Settings',
        icon: SettingOutlined,
        order: 31,
    },
];

export default systemRoutes;
