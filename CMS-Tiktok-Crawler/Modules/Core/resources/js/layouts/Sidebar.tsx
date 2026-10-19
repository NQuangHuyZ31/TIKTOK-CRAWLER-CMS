import { Layout, Menu } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import { menuSidebarConfig } from '../configs/menuConfig';

const { Sider } = Layout;

export default function Sidebar() {
	const { pathname } = useLocation();
	const items = menuSidebarConfig.map((item) => ({
		key: item.key,
		label: <NavLink to={item.path}>{item.label}</NavLink>,
		icon: <item.icon />
	}));
	const selectedKey = menuSidebarConfig.find((item) => (
		pathname === item.path || pathname.startsWith(`${item.path}/`)
	))?.key;

	return (
		<Sider
			width={220}
			style={{
				background: '#fff',
				height: '100vh',
				overflow: 'hidden',
				flexShrink: 0,
			}}
		>
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
			<Menu mode="inline" selectedKeys={selectedKey ? [selectedKey] : []} items={items} />
		</Sider>
	);
}