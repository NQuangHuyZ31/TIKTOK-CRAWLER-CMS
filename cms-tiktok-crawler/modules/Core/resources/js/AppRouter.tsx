import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAdminRoutes, useBareRoutes } from './routes/registry';
import './routes/autoRegister';
import AdminLayout from './layouts/AdminLayout';
import SpinComponent from './components/SpinComponent';
import NotFound from './pages/NotFound';
import PermissionGate from './components/PermissionGate';
import AccessDeny from './components/AccessDeny';
import { useSelector } from './store';

export default function AppRouter() {
	const adminRoutes = useAdminRoutes();
	const bareRoutes = useBareRoutes();
	const { isAuthenticated } = useSelector((state: any) => state.auth);
	const adminPath = '/admin';
	return (
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: '#1677ff',
					borderRadius: 8,
					fontSize: 14,
				},
			}}
		>
			<AntdApp>
				<BrowserRouter basename={adminPath}>
					<Suspense fallback={<SpinComponent />}>
						<Routes>
							{/* Routes configured inside AdminLayout */}
							<Route element={<AdminLayout />}>
								{adminRoutes.map((route) => {
									const Component = route.component;
									return (
										<Route
											key={route.path}
											path={route.path}
											element={
												<PermissionGate module={route.module} action={route.action} slug={route.slug} roles={route.roles} fallback={<AccessDeny />}>
													<Component />
												</PermissionGate>
											}
										/>
									);
								})}
							</Route>

							{/* Bare / Standalone / Public Routes */}
							{bareRoutes.map((route) => {
								const Component = route.component;
								if (isAuthenticated) {
									return <Route key={route.path} path={route.path} element={<Navigate to="/dashboard" replace />} />;
								}
								return <Route key={route.path} path={route.path} element={<Component />} />;
							})}

							{/* Root redirect */}
							<Route path="/" element={<Navigate to="/dashboard" replace />} />

							{/* Catch-all Not Found */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Suspense>
				</BrowserRouter>
			</AntdApp>
		</ConfigProvider>
	);
}
