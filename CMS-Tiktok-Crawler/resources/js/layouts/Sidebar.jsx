import { Layout, Menu } from 'antd';
import { DashboardOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { NavLink } from 'react-router-dom';
import { menuSidebarConfig } from '@/configs/menuConfig';

const { Sider } = Layout;

const items = menuSidebarConfig.map((item) => ({
	key: item.key,
	label: <NavLink to={`/${item.key}`}>{item.label}</NavLink>,
	icon: <item.icon />
}));

console.log('Sidebar Menu Items:', items);

export default function Sidebar() {
	return (
		<Sider width={220} style={{ background: '#fff' }}>
			<div
				style={{
					height: 76,
					alignItems: 'center',
					display: 'flex',
					justifyContent: 'center',
					fontWeight: 700,
					fontSize: 18,
					borderBottom: '1px solid #edf0f5'
				}}>Tiktok Crawler CMS</div>
			<Menu mode="inline" defaultSelectedKeys={['/dashboard']} items={items} />
		</Sider>
	);
}