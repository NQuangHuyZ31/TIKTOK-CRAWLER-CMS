import 'antd/dist/reset.css';
import '@modules/Core/assets/styles/app.css';
import { Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from '@modules/Core/assets/js/routes/index.js';
import MainLayout from '@modules/Core/assets/js/layouts/MainLayout.jsx';

const App = () => {

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