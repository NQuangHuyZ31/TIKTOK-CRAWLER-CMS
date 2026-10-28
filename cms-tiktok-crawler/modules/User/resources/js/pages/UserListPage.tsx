import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@core/components/ListLayout';
import StatusDropdown from '@core/components/StatusDropdown';
import { formatDateTime } from '@core/utils/formatDate';
import {
	USER_STATUS_FILTER_OPTIONS,
	USER_ROLE_FILTER_OPTIONS,
	USER_STATUS_CHANGE_OPTIONS,
} from '../configs/userConstants';
import { fetchAllUsers, fetchUserStatistics } from '../store/user/userThunks';
import { setParams, resetParams } from '../store/user/userSlice';
import userAPI from '../Action/user';
import type { UserItem } from '../Action/user';
import userColumnConfig from '../configs/columnConfig';
import UserKpiCards from '../components/UserKpiCards';
import UserColumn from '../components/UserColumn';
import PermissionGate from '@core/components/PermissionGate';
import { UserRoleTags } from '../components/UserRoleTags';
import useAction from '@core/hooks/useAction';

export default function UserListPage() {
	const dispatch = useDispatch();
	const { user } = useSelector((state) => state.auth);
	const { data: users, loading, statistics, statisticsLoading, pagination, params } = useSelector((state) => state.user);

	const refreshData = () => {
		dispatch(fetchAllUsers(params));
		dispatch(fetchUserStatistics());
	};

	const { act } = useAction(refreshData);

	useEffect(() => {
		refreshData();
	}, [dispatch, params]);

	const handleDelete = (id: number | string) => {
		act(() => userAPI.deleteUser(id), 'User account deleted successfully');
	};

	const handleStatusChange = (id: number | string, status: string) => {
		act(() => userAPI.updateUserStatus(id, status), `User status updated to ${status}`);
	};

	const handleResetPassword = (id: number | string) => {
		act(() => userAPI.resetPassword(id), 'Reset password email has been sent successfully');
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
						options: USER_STATUS_FILTER_OPTIONS,
						initialValue: params.status,
						onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
					},
					{
						key: 'role',
						placeholder: 'All roles',
						options: USER_ROLE_FILTER_OPTIONS,
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
					roles: (_, record: UserItem) => <UserRoleTags roles={record.roles} />,
					status: (status: string, record: UserItem) => (
						<StatusDropdown
							status={status}
							module="user"
							onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
							options={USER_STATUS_CHANGE_OPTIONS}
							disabled={user.id === record.id}
						/>
					),
					phone: (phone: string) => phone || <span style={{ color: '#bfbfbf' }}>—</span>,
					created_at: (val: string) => <span style={{ fontSize: 13, color: '#595959' }}>{formatDateTime(val)}</span>,
					action: (_, record: UserItem) => (
						<Space size={4}>
							<PermissionGate module="user" action="view">
								<Tooltip title="View Details">
									<Link to={`/user/${record.id}`}>
										<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
									</Link>
								</Tooltip>
							</PermissionGate>
							<PermissionGate module="user" action="edit">
								<Tooltip title="Edit User">
									<Link to={`/user/${record.id}/edit`}>
										<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
									</Link>
								</Tooltip>
							</PermissionGate>
							<PermissionGate module="user" action="delete">
								<Popconfirm
									title="Delete user account"
									description={`Are you sure you want to delete ${record.name}?`}
									onConfirm={() => handleDelete(record.id)}
									okText="Delete"
									cancelText="Cancel"
									okButtonProps={{ danger: true }}
								>
									<Tooltip title="Delete">
										<Button type="text" danger size="small" disabled={user.id === record.id} icon={<DeleteOutlined />} />
									</Tooltip>
								</Popconfirm>
							</PermissionGate>
							<PermissionGate module="user" roles={'admin'}>
								<Popconfirm
									title="Reset password user"
									description={`Are you sure you want to reset password ${record.name}?`}
									onConfirm={() => handleResetPassword(record.id)}
									okText="Reset"
									cancelText="Cancel"
									okButtonProps={{ danger: true }}
								>
									<Tooltip title="Reset Password">
										<Button type="text" size="small" icon={<KeyOutlined />} disabled={user.id === record.id} />
									</Tooltip>
								</Popconfirm>
							</PermissionGate>
						</Space>
					),
				}}
			/>
		</div>
	);
}
