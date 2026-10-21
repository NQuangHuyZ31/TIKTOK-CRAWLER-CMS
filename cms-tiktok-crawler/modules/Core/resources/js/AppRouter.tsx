import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAdminRoutes, useBareRoutes } from './routes';
import AdminLayout from './layouts/AdminLayout';
import SpinComponent from './components/SpinComponent';

export default function AppRouter() {
	const adminRoutes = useAdminRoutes();
	const bareRoutes = useBareRoutes();
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
											element={<Component />}
										/>
									);
								})}
							</Route>

							{/* Bare / Standalone / Public Routes */}
							{bareRoutes.map((route) => {
								const Component = route.component;
								return (
									<Route
										key={route.path}
										path={route.path}
										element={<Component />}
									/>
								);
							})}

							{/* Root redirect */}
							<Route
								path="/"
								element={<Navigate to="/dashboard" replace />}
							/>

							{/* Catch-all Not Found */}
							<Route
								path="*"
								element={<Navigate to="/404" replace />}
							/>
						</Routes>
					</Suspense>
				</BrowserRouter>
			</AntdApp>
		</ConfigProvider>
	);
}
