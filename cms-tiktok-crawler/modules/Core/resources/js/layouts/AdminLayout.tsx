import React from 'react';
import { Layout, theme } from 'antd';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSelector } from '../store';
import { LayoutProvider, useLayout } from '../contexts/LayoutContext';

const { Content } = Layout;

export interface AdminLayoutProps {
	children?: React.ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
	const {
		token: { colorBgContainer, borderRadiusLG },
	} = theme.useToken();
	const { isMobile } = useLayout();

	return (
		<Layout hasSider style={{ height: '100vh', overflow: 'hidden', background: '#f5f7fb' }}>
			<Sidebar />
			<Layout style={{ minWidth: 0, height: '100vh', overflow: 'hidden', background: '#f5f7fb' }}>
				<Header />
				<Content
					style={{
						minHeight: 0,
						overflowX: 'hidden',
						overflowY: 'auto',
						padding: isMobile ? '12px 10px 16px' : '20px 20px 24px',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<div
						style={{
							padding: isMobile ? 16 : 24,
							background: colorBgContainer,
							borderRadius: borderRadiusLG,
							boxShadow: '0 2px 8px rgba(23, 32, 51, 0.03)',
							border: '1px solid #edf0f5',
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						{children || <Outlet />}
					</div>
				</Content>
			</Layout>
		</Layout>
	);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
	const location = useLocation();
	const { isAuthenticated } = useSelector((state: any) => state.auth);

	if (!isAuthenticated) {
		return <Navigate to="/auth/login" state={{ from: location }} replace />;
	}

	return (
		<LayoutProvider>
			<AdminLayoutInner>{children}</AdminLayoutInner>
		</LayoutProvider>
	);
}
