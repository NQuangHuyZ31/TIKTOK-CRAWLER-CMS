import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { useRoutes } from './routes';
import MainLayout from './layouts/MainLayout';

export default function AppRouter() {
    const routes = useRoutes();

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
                            {routes.map((route) => {
                                const Component = route.component;
                                const isBare = route.layout === 'bare' || route.layout === 'none' || route.isPrivate === false;

                                return (
                                    <Route
                                        key={route.path}
                                        path={route.path}
                                        element={
                                            isBare ? (
                                                <Component />
                                            ) : (
                                                <MainLayout>
                                                    <Component />
                                                </MainLayout>
                                            )
                                        }
                                    />
                                );
                            })}

                            {/* Root redirect */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* Catch-all Not Found */}
                            <Route path="*" element={<Navigate to="/404" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </AntdApp>
        </ConfigProvider>
    );
}