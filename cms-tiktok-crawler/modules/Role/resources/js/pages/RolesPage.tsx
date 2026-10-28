import React, { useEffect } from 'react';
import ListLayout from '@core/components/ListLayout';
import useAction from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { deleteRole, type RoleItem } from '../Action/role';
import { setParams, resetParams, setModalOpen, setSelectedRole } from '../store/role/roleSlice';
import { fetchRoles, fetchAvailablePermissions } from '../store/role/roleThunks';
import RoleFormModal from '../components/RoleFormModal';
import RoleTableList from '../components/RoleTableList';

export default function RolesPage() {
	const dispatch = useDispatch();
	const { data: roles, permissions, loading, pagination, params, modalOpen, selectedRole } = useSelector((state) => state.role);

	const { execute: handleDelete } = useAction((role: RoleItem) => deleteRole(role.id), {
		successMessage: (_res, role) => `Role '${role.name}' deleted successfully.`,
		onSuccess: () => dispatch(fetchRoles(params)),
	});

	useEffect(() => {
		dispatch(fetchRoles(params));
	}, [dispatch, params]);

	useEffect(() => {
		dispatch(fetchAvailablePermissions());
	}, [dispatch]);

	const handleSearch = (val: string) => {
		dispatch(setParams({ search: val.trim() || undefined, page: 1 }));
	};

	const handleOpenCreate = () => {
		dispatch(setSelectedRole(null));
		dispatch(setModalOpen(true));
	};

	const handleOpenEdit = (role: RoleItem) => {
		dispatch(setSelectedRole(role));
		dispatch(setModalOpen(true));
	};

	return (
		<div>
			<ListLayout
				title="Roles & Access Control (RBAC)"
				subtitle="Configure system user access levels and granular module permissions"
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Users', href: '/admin/user' }, { title: 'Role Management' }]}
				onAdd={handleOpenCreate}
				addText="Create Role"
				cardTitle="Configured System Roles"
				showSearch
				searchPlaceholder="Search roles by name or slug..."
				searchValue={params.search}
				onSearch={handleSearch}
				onResetFilters={() => dispatch(resetParams())}
				onRefresh={() => dispatch(fetchRoles(params))}
				refreshing={loading}
			>
				<RoleTableList data={roles} loading={loading} pagination={pagination} onPageChange={(page, pageSize) => dispatch(setParams({ page, per_page: pageSize }))} onEdit={handleOpenEdit} onDelete={handleDelete} />
			</ListLayout>

			<RoleFormModal open={modalOpen} onClose={() => dispatch(setModalOpen(false))} onSuccess={() => dispatch(fetchRoles(params))} role={selectedRole} availablePermissions={permissions} />
		</div>
	);
}
