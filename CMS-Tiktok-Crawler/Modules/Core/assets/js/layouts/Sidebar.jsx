import { Layout, Menu } from 'antd';
import { NavLink } from 'react-router-dom';
import { menuSidebarConfig } from '@modules/Core/assets/js/configs/menuConfig';

const { Sider } = Layout;

const items = menuSidebarConfig.map((item) => ({
	key: item.key,
	label: <NavLink to={`/${item.key}`}>{item.label}</NavLink>,
	icon: <item.icon />
}));

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