import React from 'react';
import { Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;

export interface AdminLayoutProps {
	children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken();

	return (
		<Layout style={{ height: '100vh', overflow: 'hidden' }}>
			<Sidebar />
			<Layout style={{ minWidth: 0, height: '100vh', overflow: 'hidden' }}>
				<Header />
				<Content
					style={{
						minHeight: 0,
						overflowX: 'hidden',
						overflowY: 'auto',
						margin: '24px 16px 0',
					}}
				>
					<div
						style={{
							padding: 24,
							minHeight: 360,
							background: colorBgContainer,
							borderRadius: borderRadiusLG,
						}}
					>
						{children || <Outlet />}
					</div>
				</Content>
			</Layout>
		</Layout>
	);
}
