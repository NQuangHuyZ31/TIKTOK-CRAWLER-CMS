import React, { useEffect, useMemo } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography } from 'antd';
import { KeyOutlined, PlusOutlined, ReloadOutlined, SafetyCertificateOutlined, SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import CardKPI from '@core/components/CardKPI';
import PageHeader from '@core/components/PageHeader';
import useAction from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { deleteRole, type RoleItem } from '../Action/role';
import { setParams, setModalOpen, setSelectedRole } from '../store/role/roleSlice';
import { fetchRoles, fetchAvailablePermissions } from '../store/role/roleThunks';
import RoleFormModal from '../components/RoleFormModal';
import RoleTableList from '../components/RoleTableList';

const { Text } = Typography;

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

	const totalPermissionsCount = useMemo(() => {
		return Object.values(permissions).reduce((acc, list) => acc + list.length, 0);
	}, [permissions]);

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
			<PageHeader
				title="Roles & Access Control (RBAC)"
				subtitle="Configure system user access levels and granular module permissions"
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Roles', href: '/admin/role/roles' }, { title: 'Role Management' }]}
				extra={
					<Space>
						<Button icon={<ReloadOutlined />} onClick={() => dispatch(fetchRoles(params))} loading={loading}>
							Refresh
						</Button>
						<Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
							Create Role
						</Button>
					</Space>
				}
			/>

			<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
				<Col span={24} sm={8}>
					<CardKPI title="Defined Roles" value={pagination.total || roles.length} icon={<UsergroupAddOutlined />} color="#1677ff" subtext="Active system access profiles" loading={loading} />
				</Col>

				<Col span={24} sm={8}>
					<CardKPI title="System Permissions" value={totalPermissionsCount || 12} icon={<KeyOutlined />} color="#52c41a" subtext="Module actions mapped in RBAC matrix" loading={loading} />
				</Col>

				<Col span={24} sm={8}>
					<CardKPI title="Administrator Access" value="Super Admin" icon={<SafetyCertificateOutlined />} color="#faad14" subtext="Protected system superuser role" loading={loading} />
				</Col>
			</Row>

			<Card
				bordered={false}
				title={
					<Space style={{ width: '100%', justifyContent: 'space-between' }}>
						<Text strong style={{ fontSize: 16 }}>
							Configured System Roles
						</Text>
						<Input
							placeholder="Search by role name or slug..."
							prefix={<SearchOutlined />}
							allowClear
							style={{ width: 280 }}
							defaultValue={params.search || ''}
							onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
							onChange={(e) => {
								if (!e.target.value) handleSearch('');
							}}
						/>
					</Space>
				}
			>
				<RoleTableList data={roles} loading={loading} pagination={pagination} onPageChange={(page, pageSize) => dispatch(setParams({ page, per_page: pageSize }))} onEdit={handleOpenEdit} onDelete={handleDelete} />
			</Card>

			<RoleFormModal open={modalOpen} onClose={() => dispatch(setModalOpen(false))} onSuccess={() => dispatch(fetchRoles(params))} role={selectedRole} availablePermissions={permissions} />
		</div>
	);
}
