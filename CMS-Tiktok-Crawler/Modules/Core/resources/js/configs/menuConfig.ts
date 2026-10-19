import { DashboardOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';

const menuSidebarConfig = [
	{
		key: 'dashboard',
		path: '/dashboard',
		label: 'Dashboard',
		icon: DashboardOutlined,
	},

	{
		key: 'crawler-crawl-job',
		path: '/crawler/crawl-job',
		label: 'Crawl Jobs',
		icon: RobotOutlined,
	},

	{
		key: 'tiktok-account',
		path: '/tiktok-account',
		label: 'TikTok Accounts',
		icon: UserOutlined,
	}
];

export { menuSidebarConfig };