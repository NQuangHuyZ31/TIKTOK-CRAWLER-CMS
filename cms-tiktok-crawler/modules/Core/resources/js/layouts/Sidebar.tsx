import React, { isValidElement } from 'react';
import { Layout, Menu } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import { useMenuRoutes } from '../routes';

const { Sider } = Layout;

export default function Sidebar() {
	const { pathname } = useLocation();
	const menuRoutes = useMenuRoutes();

	const items = menuRoutes.map((item) => {
		let iconNode: React.ReactNode = null;
		if (item.icon) {
			if (isValidElement(item.icon)) {
				iconNode = item.icon;
			} else if (typeof item.icon === 'function') {
				const IconComponent = item.icon as React.ComponentType;
				iconNode = <IconComponent />;
			}
		}

		return {
			key: item.path,
			label: <NavLink to={item.path}>{item.label}</NavLink>,
			icon: iconNode,
		};
	});

	// Find the best match: exact match or child path, prioritizing longer paths
	const selectedKey = menuRoutes
		.filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
		.sort((a, b) => b.path.length - a.path.length)[0]?.path;

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
					borderBottom: '1px solid #edf0f5',
				}}
			>
				Tiktok Crawler CMS
			</div>
			<Menu mode="inline" selectedKeys={selectedKey ? [selectedKey] : []} items={items} />
		</Sider>
	);
}