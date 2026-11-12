import 'antd/dist/reset.css';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import AppRouter from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function mount(): void {
	const container = document.getElementById('root') || document.getElementById('app');
	if (container && !(container as any).__reactRoot) {
		const root = createRoot(container);
		(container as any).__reactRoot = root;
		root.render(
			<React.StrictMode>
				<Provider store={store}>
					<ThemeProvider>
						<AuthProvider>
							<AppRouter />
						</AuthProvider>
					</ThemeProvider>
				</Provider>
			</React.StrictMode>,
		);
	}
}

if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount);
	} else {
		setTimeout(mount, 0);
	}
}

export default AppRouter;
