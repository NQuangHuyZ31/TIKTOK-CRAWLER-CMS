import 'antd/dist/reset.css';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import AppRouter from './AppRouter';

function mount(): void {
	const container = document.getElementById('root') || document.getElementById('app');
	if (container && !(container as any).__reactRoot) {
		const root = createRoot(container);
		(container as any).__reactRoot = root;
		root.render(
			<React.StrictMode>
				<Provider store={store}>
					<AppRouter />
				</Provider>
			</React.StrictMode>
		);
	}
}

// In modular architecture, child module scripts (Crawler, TiktokAccount) are loaded right after Core in DOM.
// Waiting for DOMContentLoaded (or next tick) guarantees all module scripts have executed registerRoutes()
// before React evaluates the current URL, completely eliminating false 404 redirects on page refresh.
if (typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mount);
	} else {
		setTimeout(mount, 0);
	}
}

export default AppRouter;
