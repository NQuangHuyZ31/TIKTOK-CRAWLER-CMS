import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes';
import MainLayout from './layouts/MainLayout';

export default function AppRouter() {
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
					<Routes>
						{/* Public Routes */}
						{publicRoutes.map((route: any) => (
							<Route key={route.path} path={route.path} element={<route.component />} />
						))}

						{/* Private Routes */}
						{privateRoutes.map((route: any) => (
							<Route
								key={route.path}
								path={route.path}
								element={
									<MainLayout>
										<route.component />
									</MainLayout>
								}
							/>
						))}

						{/* Root redirect */}
						<Route path="/" element={<Navigate to="/dashboard" replace />} />

						{/* Not Found */}
						<Route path="*" element={<Navigate to="/404" replace />} />
					</Routes>
				</BrowserRouter>
			</AntdApp>
		</ConfigProvider>
	);
}
