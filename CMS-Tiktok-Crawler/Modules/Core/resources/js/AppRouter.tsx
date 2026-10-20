import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useAdminRoutes, useBareRoutes } from './routes';
import AdminLayout from './layouts/AdminLayout';

export default function AppRouter() {
	const adminRoutes = useAdminRoutes();
	const bareRoutes = useBareRoutes();

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
				<BrowserRouter>
					<Suspense
						fallback={
							<div
								style={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									minHeight: '60vh',
								}}
							>
								<Spin size="large" />
							</div>
						}
					>
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
