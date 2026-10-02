import { useEffect } from 'react';
import { Spin } from 'antd';

export default function SpinComponent() {
	useEffect(() => {
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50">
			<Spin size="large" />
		</div>
	);
}