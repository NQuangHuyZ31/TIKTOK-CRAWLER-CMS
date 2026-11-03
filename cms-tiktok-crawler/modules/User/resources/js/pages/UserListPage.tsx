import React, { useEffect } from 'react';
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
import { UserRoleTags } from '../components/UserRoleTags';
import UserTableActions from '../components/userList/UserTableActions';
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
			<UserKpiCards statistics={statistics} loading={statisticsLoading} />

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
					roles: (_, record: UserItem) => <UserRoleTags roles={record.roles} permissionType={record.permission_type} />,
					status: (status: string, record: UserItem) => (
						<StatusDropdown
							status={status}
							module="user"
							onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
							options={USER_STATUS_CHANGE_OPTIONS}
							disabled={user?.id === record.id}
						/>
					),
					phone: (phone: string) => phone || <span style={{ color: '#bfbfbf' }}>—</span>,
					created_at: (val: string) => <span style={{ fontSize: 13, color: '#595959' }}>{formatDateTime(val)}</span>,
					action: (_, record: UserItem) => (
						<UserTableActions
							record={record}
							currentUserId={user?.id}
							onDelete={handleDelete}
							onResetPassword={handleResetPassword}
						/>
					),
				}}
			/>
		</div>
	);
}
