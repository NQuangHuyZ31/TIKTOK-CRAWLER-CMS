import { AppstoreOutlined } from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import ModuleListPage from '../pages/ModuleListPage';

const moduleManagerRoutes: RouteDef[] = [
	{
		path: '/system/modules',
		component: ModuleListPage,
		layout: 'admin',
		parentPath: '/system',
		module: 'system',
		action: 'view',
		title: 'Module Management',
		label: 'Modules',
		icon: AppstoreOutlined,
		order: 44,
	},
];

export default moduleManagerRoutes;
