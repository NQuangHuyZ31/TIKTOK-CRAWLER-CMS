import React, { useEffect } from 'react';
import ListLayout, { DynamicFilterField } from '@core/components/ListLayout';
import { useDispatch, useSelector } from '@core/store';
import { LOGIN_STATUS_OPTIONS } from '../configs/activityLogConfig';
import { setLoginParams, resetLoginParams } from '../store/system/systemSlice';
import { fetchLoginLogs } from '../store/system/systemThunks';
import LoginLogTable from '../components/LoginLogTable';

export default function LoginLogsPage() {
	const dispatch = useDispatch();
	const { loginLogs, loginLoading, loginPagination, loginParams } = useSelector((state) => state.system);

	useEffect(() => {
		dispatch(fetchLoginLogs(loginParams));
	}, [dispatch, loginParams]);

	const handleSearch = (val: string) => {
		dispatch(setLoginParams({ search: val.trim() || undefined, page: 1 }));
	};

	const filters: DynamicFilterField[] = [
		{
			key: 'status',
			placeholder: 'Filter by Status',
			type: 'select',
			value: loginParams.status,
			width: 160,
			options: LOGIN_STATUS_OPTIONS,
			onChange: (val) => dispatch(setLoginParams({ status: val || undefined, page: 1 })),
		},
	];

	return (
		<ListLayout
			title="Login Logs"
			subtitle="Audit trail of user authentication and login events across devices"
			breadcrumbs={[
				{ title: 'Dashboard', href: '/admin/dashboard' },
				{ title: 'System', href: '/admin/system' },
				{ title: 'Login Logs' },
			]}
			cardTitle="Authentication Activity Stream"
			showSearch
			searchPlaceholder="Search by email, IP address, device..."
			searchValue={loginParams.search}
			onSearch={handleSearch}
			filters={filters}
			onResetFilters={() => dispatch(resetLoginParams())}
			onRefresh={() => dispatch(fetchLoginLogs(loginParams))}
			refreshing={loginLoading}
		>
			<LoginLogTable
				data={loginLogs}
				loading={loginLoading}
				pagination={loginPagination}
				onPageChange={(page, pageSize) => dispatch(setLoginParams({ page, per_page: pageSize }))}
			/>
		</ListLayout>
	);
}
