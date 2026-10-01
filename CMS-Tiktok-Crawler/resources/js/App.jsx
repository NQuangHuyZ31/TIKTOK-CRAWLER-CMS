import 'antd/dist/reset.css';
import '../css/app.css';
import { Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes/index.js';
import MainLayout from './layouts/MainLayout';

const App = () => {
	console.log('Public Routes:', publicRoutes);
	console.log('Private Routes:', privateRoutes);
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
			<BrowserRouter>
				<Routes>
					{/* Public Routes */}
					{publicRoutes.map((route) => (
						<Route key={route.path} path={route.path} element={<route.component />} />
					))}

					{/* Private Routes */}
					{privateRoutes.map((route) => (
						<Route key={route.path} path={route.path} element={<MainLayout>{<route.component />}</MainLayout>} />
					))}

					{/* Not Found Route */}
					<Route path="*" element={<Navigate to='/404' replace />} />
				</Routes>
			</BrowserRouter>
		</ConfigProvider>
	);
};

export default App;