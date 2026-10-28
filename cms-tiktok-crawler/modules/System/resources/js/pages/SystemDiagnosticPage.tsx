import React, { useEffect } from 'react';
import ListLayout from '@core/components/ListLayout';
import { useDispatch, useSelector } from '@core/store';
import { fetchSystemDiagnostic } from '../store/system/systemThunks';
import SystemInfo from '../components/SystemInfo';

export default function SystemDiagnosticPage() {
	const dispatch = useDispatch();
	const { diagnostic, diagnosticLoading } = useSelector((state) => state.system);

	const handleRefresh = () => {
		dispatch(fetchSystemDiagnostic());
	};

	useEffect(() => {
		handleRefresh();
	}, [dispatch]);

	return (
		<ListLayout
			title="System Diagnostic"
			subtitle="Run diagnostic checks, assess environment health, and monitor runtime metrics"
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'System' }]}
			onRefresh={handleRefresh}
			refreshing={diagnosticLoading}
		>
			<SystemInfo info={diagnostic} loading={diagnosticLoading} onRefresh={handleRefresh} />
		</ListLayout>
	);
}
