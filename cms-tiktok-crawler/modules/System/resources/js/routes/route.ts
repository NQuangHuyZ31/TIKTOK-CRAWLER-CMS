import {
	AuditOutlined,
	DashboardOutlined,
	SafetyCertificateOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import type { RouteDef } from '@core/routes/registry';
import LoginLogsPage from '../pages/LoginLogsPage';
import ActivityLogsPage from '../pages/ActivityLogsPage';
import SystemDiagnosticPage from '../pages/SystemDiagnosticPage';

const systemRoutes: RouteDef[] = [
	{
		path: '/system',
		component: SystemDiagnosticPage,
		layout: 'admin',
		title: 'System Diagnostic',
		label: 'System Diagnostic',
		module: 'system',
		action: 'view',
		icon: DashboardOutlined,
		order: 40,
	},
	{
		path: '/system/login-logs',
		component: LoginLogsPage,
		layout: 'admin',
		title: 'Login Logs',
		label: 'Login Logs',
		module: 'system',
		action: 'view',
		parentPath: '/system',
		icon: SafetyCertificateOutlined,
		order: 41,
	},
	{
		path: '/system/activity-logs',
		component: ActivityLogsPage,
		layout: 'admin',
		title: 'Activity Logs',
		label: 'Activity Logs',
		module: 'system',
		action: 'view',
		parentPath: '/system',
		icon: AuditOutlined,
		order: 42,
	},
];

export default systemRoutes;
