import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip, Tag, Popover, App as AntdApp, Dropdown, Alert, Result } from 'antd';
import type { MenuProps } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SafetyCertificateOutlined, CrownOutlined, LockOutlined, DownOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/components/ListLayout';
import StatusTag from '@core/components/StatusTag';
import StatusDropdown from '@core/components/StatusDropdown';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchAllUsers, fetchUserStatistics } from '../store/user/userThunks';
import { setParams, resetParams } from '../store/user/userSlice';
import userAPI from '../Action/user';
import type { UserItem } from '../Action/user';
import userColumnConfig from '../configs/columnConfig';
import { ROLE_CONFIGS, STATUS_CONFIGS } from '../configs/userConstants';
import UserKpiCards from '../components/UserKpiCards';
import UserColumn from '../components/UserColumn';
import AccessDeny from '@/components/AccessDeny';

export default function UserListPage() {
	const { message } = AntdApp.useApp();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const { data: users, loading, error, statistics, statisticsLoading, pagination, params } = useSelector((state) => state.user);

	useEffect(() => {
		dispatch(fetchAllUsers(params));
		dispatch(fetchUserStatistics());
	}, [dispatch, params]);

	const handleDelete = async (id: number | string) => {
		try {
			const res = await userAPI.deleteUser(id);
			message.success(res?.message || 'User account deleted successfully');
			dispatch(fetchAllUsers(params));
			dispatch(fetchUserStatistics());
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to delete user account');
		}
	};

	const handleStatusChange = async (id: number | string, status: string) => {
		try {
			const res = await userAPI.updateUserStatus(id, status);
			message.success(res?.message || `User status updated to ${status}`);
			dispatch(fetchAllUsers(params));
			dispatch(fetchUserStatistics());
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to update user status');
		}
	};

	const renderRoleBadge = (roles: any[] = []) => {
		if (!roles || roles.length === 0) {
			return <Tag color="default">No Role</Tag>;
		}

		return (
			<Space size={4} wrap>
				{roles.map((r) => {
					const slug = typeof r === 'string' ? r : r.slug;
					const cfg = ROLE_CONFIGS[slug] || ROLE_CONFIGS.viewer;
					const icon = slug === 'admin' ? <CrownOutlined /> : <SafetyCertificateOutlined />;

					return (
						<Tag
							key={slug}
							icon={icon}
							style={{
								color: cfg.color,
								background: cfg.bg,
								borderColor: cfg.border,
								fontWeight: 600,
								fontSize: 11,
								padding: '2px 8px',
								borderRadius: 4,
							}}
						>
							{cfg.name}
						</Tag>
					);
				})}
			</Space>
		);
	};

	return (
		<div>
			{/* Top KPI Cards */}
			<UserKpiCards statistics={statistics} loading={statisticsLoading} />

			{/* Main User List Table */}
			<ListLayout
				title="User Accounts"
				subtitle="Manage CMS user accounts, roles, and modular permissions (View/Edit) per user."
				onAdd="/user/create"
				addText="Create User"
				cardTitle="Users List"
				showSearch
				searchPlaceholder="Search by name, email, phone..."
				searchValue={params.search}
				onSearch={(keyword) => dispatch(setParams({ search: keyword, page: 1 }))}
				filters={[
					{
						key: 'status',
						placeholder: 'All statuses',
						options: [
							{ label: 'All statuses', value: '' },
							{ label: 'Active', value: 'active' },
							{ label: 'Inactive', value: 'inactive' },
							{ label: 'Blocked', value: 'blocked' },
						],
						initialValue: params.status,
						onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
					},
					{
						key: 'role',
						placeholder: 'All roles',
						options: [
							{ label: 'All roles', value: '' },
							{ label: 'Super Admin', value: 'admin' },
							{ label: 'Operations Manager', value: 'manager' },
							{ label: 'Crawler Specialist', value: 'editor' },
							{ label: 'Data Viewer', value: 'viewer' },
						],
						initialValue: params.role,
						onChange: (val) => dispatch(setParams({ role: val, page: 1 })),
					},
				]}
				onResetFilters={() => dispatch(resetParams())}
				onRefresh={() => {
					dispatch(fetchAllUsers(params));
					dispatch(fetchUserStatistics());
				}}
				refreshing={loading}
				columns={userColumnConfig}
				data={users}
				loading={loading}
				pagination={pagination}
				onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}
				renderColumns={{
					id: (id) => <span style={{ fontWeight: 600, color: '#1677ff' }}>#{id}</span>,
					name: (_, record: UserItem) => <UserColumn id={record.id} name={record.name} email={record.email} avatarUrl={record.avatar_url} />,
					roles: (_, record: UserItem) => renderRoleBadge(record.roles),
					status: (status: string, record: UserItem) => (
						<StatusDropdown
							status={status}
							module="user"
							onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
							options={[
								{ value: 'active', label: 'Set as Active' },
								{ value: 'inactive', label: 'Set as Inactive' },
								{ value: 'blocked', label: 'Block Account', danger: true },
							]}
						/>
					),
					phone: (phone: string) => phone || <span style={{ color: '#bfbfbf' }}>—</span>,
					created_at: (val: string) => <span style={{ fontSize: 13, color: '#595959' }}>{formatDateTime(val)}</span>,
					action: (_, record: UserItem) => (
						<Space size={4}>
							<Tooltip title="View Details">
								<Link to={`/user/${record.id}`}>
									<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
								</Link>
							</Tooltip>
							<Tooltip title="Edit User">
								<Link to={`/user/${record.id}/edit`}>
									<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
								</Link>
							</Tooltip>
							<Popconfirm
								title="Delete user account"
								description={`Are you sure you want to delete ${record.name}?`}
								onConfirm={() => handleDelete(record.id)}
								okText="Delete"
								cancelText="Cancel"
								okButtonProps={{ danger: true }}
							>
								<Tooltip title="Delete">
									<Button type="text" danger size="small" icon={<DeleteOutlined />} />
								</Tooltip>
							</Popconfirm>
						</Space>
					),
				}}
			/>
		</div>
	);
}
