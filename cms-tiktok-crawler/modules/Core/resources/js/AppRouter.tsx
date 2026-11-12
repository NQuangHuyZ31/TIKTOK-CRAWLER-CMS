import { App as AntdApp, ConfigProvider, theme } from 'antd';
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
import { useTheme } from './contexts/ThemeContext';

export default function AppRouter() {
	const adminRoutes = useAdminRoutes();
	const bareRoutes = useBareRoutes();
	const { isAuthenticated } = useSelector((state: any) => state.auth);
	const { isDark } = useTheme();

	const hasAdminPrefix = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
	const basename = hasAdminPrefix ? '/admin' : '';
	const rootRedirect = hasAdminPrefix ? '/dashboard' : '/admin/dashboard';

	return (
		<ConfigProvider
			theme={{
				algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
				token: {
					colorPrimary: '#EC008C',
					borderRadius: 8,
					fontSize: 14,
				},
			}}
		>
			<AntdApp>
				<BrowserRouter basename={basename}>
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
								if (route.guestOnly && isAuthenticated) {
									return <Route key={route.path} path={route.path} element={<Navigate to={rootRedirect} replace />} />;
								}
								if (route.isPrivate && !isAuthenticated) {
									return <Route key={route.path} path={route.path} element={<Navigate to="/auth/login" replace />} />;
								}
								return <Route key={route.path} path={route.path} element={<Component />} />;
							})}

							{/* Root redirect */}
							<Route path="/" element={<Navigate to={rootRedirect} replace />} />

							{/* Catch-all Not Found */}
							<Route path="*" element={<NotFound />} />
						</Routes>
					</Suspense>
				</BrowserRouter>
			</AntdApp>
		</ConfigProvider>
	);
}
