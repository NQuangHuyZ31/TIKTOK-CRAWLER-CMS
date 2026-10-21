import 'antd/dist/reset.css';
import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import AppRouter from './AppRouter';

const container = document.getElementById('root') || document.getElementById('app');
if (container) {
	const root = createRoot(container);
	root.render(
		<React.StrictMode>
			<Provider store={store}>
				<AppRouter />
			</Provider>
		</React.StrictMode>
	);
}

export default AppRouter;
