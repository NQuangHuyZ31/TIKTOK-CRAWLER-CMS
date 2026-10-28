import React, { useEffect, useMemo } from 'react';
import { Button, Space } from 'antd';
import { AppstoreAddOutlined, PlusOutlined } from '@ant-design/icons';
import ListLayout, { type DynamicFilterField } from '@core/components/ListLayout';
import useAction from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { deletePermission, type PermissionItem } from '../Action/permission';
import { setParams, resetParams, setCreateModuleModalOpen, setCreatePermissionModalOpen } from '../store/permission/permissionSlice';
import { fetchPermissions, fetchDistinctModules } from '../store/permission/permissionThunks';
import CreateModuleModal from '../components/CreateModuleModal';
import CreatePermissionModal from '../components/CreatePermissionModal';
import PermissionTableList from '../components/PermissionTableList';

const ACTION_OPTIONS = [
	{ value: '', label: 'All Actions' },
	{ value: 'view', label: 'View (view)' },
	{ value: 'create', label: 'Create (create)' },
	{ value: 'edit', label: 'Edit (edit)' },
	{ value: 'delete', label: 'Delete (delete)' },
	{ value: 'export', label: 'Export (export)' },
	{ value: 'import', label: 'Import (import)' },
	{ value: 'approve', label: 'Approve (approve)' },
	{ value: 'assign', label: 'Assign (assign)' },
	{ value: 'manage', label: 'Manage (manage)' },
];

export default function PermissionsPage() {
	const dispatch = useDispatch();
	const { data: permissions, modulesList, loading, pagination, params, createPermissionModalOpen, createModuleModalOpen } = useSelector((state) => state.permission);

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
				options: ACTION_OPTIONS,
				showSearch: true,
				allowClear: true,
				initialValue: params.action,
				onChange: (val: any) => dispatch(setParams({ action: val || undefined, page: 1 })),
				width: 160,
			},
		];
	}, [modulesList, params.module, params.action, dispatch]);

	const headerActions = (
		<Space>
			<Button icon={<AppstoreAddOutlined />} onClick={() => dispatch(setCreateModuleModalOpen(true))}>
				Create Module
			</Button>
			<Button type="primary" icon={<PlusOutlined />} onClick={() => dispatch(setCreatePermissionModalOpen(true))}>
				Create Permission
			</Button>
		</Space>
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

			<CreateModuleModal
				open={createModuleModalOpen}
				onClose={() => dispatch(setCreateModuleModalOpen(false))}
				onSuccess={() => {
					dispatch(fetchPermissions(params));
					dispatch(fetchDistinctModules());
				}}
			/>

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
