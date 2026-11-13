import React, { useEffect, useMemo } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ListLayout, { type DynamicFilterField } from '@core/components/ListLayout';
import useAction from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { deletePermission, type PermissionItem } from '../Action/permission';
import { setParams, resetParams, setCreatePermissionModalOpen } from '../store/permission/permissionSlice';
import { fetchPermissions, fetchDistinctModules } from '../store/permission/permissionThunks';
import CreatePermissionModal from '../components/CreatePermissionModal';
import PermissionTableList from '../components/PermissionTableList';
import { COMMON_PERMISSION_ACTIONS } from '../configs/permissionOptions';

export default function PermissionsPage() {
	const dispatch = useDispatch();
	const { data: permissions, modulesList, loading, pagination, params, createPermissionModalOpen } = useSelector((state) => state.permission);

	const { execute: handleDelete } = useAction((permission: PermissionItem) => deletePermission(permission.id), {
		successMessage: (_res, permission) => `Permission '${permission.slug || permission.name}' deleted successfully.`,
		onSuccess: () => {
			dispatch(fetchPermissions(params));
			dispatch(fetchDistinctModules());
		},
	});

	useEffect(() => {
		dispatch(fetchPermissions(params));
	}, [dispatch, params]);

	useEffect(() => {
		dispatch(fetchDistinctModules());
	}, [dispatch]);

	const handleSearch = (val: string) => {
		dispatch(setParams({ search: val.trim() || undefined, page: 1 }));
	};

	const handleResetFilters = () => {
		dispatch(resetParams());
	};

	const handlePageChange = (page: number, pageSize: number) => {
		dispatch(setParams({ page, per_page: pageSize }));
	};

	const filterFields: DynamicFilterField[] = useMemo(() => {
		const moduleOptions = [{ value: '', label: 'All Modules' }, ...modulesList.map((mod) => ({ value: mod, label: mod.toUpperCase() }))];

		return [
			{
				key: 'module',
				placeholder: 'Filter by Module',
				options: moduleOptions,
				showSearch: true,
				allowClear: true,
				initialValue: params.module,
				onChange: (val: any) => dispatch(setParams({ module: val || undefined, page: 1 })),
				width: 170,
			},
			{
				key: 'action',
				placeholder: 'Filter by Action',
				options: COMMON_PERMISSION_ACTIONS,
				showSearch: true,
				allowClear: true,
				initialValue: params.action,
				onChange: (val: any) => dispatch(setParams({ action: val || undefined, page: 1 })),
				width: 160,
			},
		];
	}, [modulesList, params.module, params.action, dispatch]);

	const headerActions = (
		<Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(setCreatePermissionModalOpen(true))}>
			Create Permission
		</Button>
	);

	return (
		<div>
			<ListLayout
				title="System Permissions"
				subtitle="Manage system capabilities, module definitions, and granular action permissions"
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Users', href: '/admin/user' }, { title: 'Permissions' }]}
				extra={headerActions}
				cardTitle="Configured System Permissions"
				showSearch
				searchPlaceholder="Search permissions by name, slug or description..."
				searchValue={params.search}
				onSearch={handleSearch}
				filters={filterFields}
				onResetFilters={handleResetFilters}
				onRefresh={() => {
					dispatch(fetchPermissions(params));
					dispatch(fetchDistinctModules());
				}}
				refreshing={loading}
			>
				<PermissionTableList data={permissions} loading={loading} pagination={pagination} onPageChange={handlePageChange} onDelete={handleDelete} />
			</ListLayout>

			<CreatePermissionModal
				open={createPermissionModalOpen}
				modulesList={modulesList}
				onClose={() => dispatch(setCreatePermissionModalOpen(false))}
				onSuccess={() => {
					dispatch(fetchPermissions(params));
					dispatch(fetchDistinctModules());
				}}
			/>
		</div>
	);
}
