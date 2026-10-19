import 'antd/dist/reset.css';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { publicRoutes, privateRoutes } from '@core/routes';
import MainLayout from '@core/layouts/MainLayout';

export default function App() {
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
