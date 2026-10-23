import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip, App as AntdApp, InputNumber, Form } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/components/ListLayout';
import { PermissionGate, StatusDropdown } from '@core/components';
import usePermission from '@core/hooks/usePermission';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchAllTiktokAccounts } from '../store/tiktokAccount/tiktokAccountThunks';
import { setParams, resetParams } from '../store/tiktokAccount/tiktokAccountSlice';
import tiktokAccountAPI from '../Action/tiktokAccount';
import columnConfig from '../configs/columnConfig';
import AccountColumn from '../components/AccountColumn';

export default function TiktokAccountPage() {
	const { message } = AntdApp.useApp();
	const { can } = usePermission();
	const dispatch = useDispatch();
	const { data: accounts, loading, pagination, params } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fetchAllTiktokAccounts(params));
	}, [dispatch, params]);

	const handleDelete = async (id: number | string) => {
		try {
			const res = await tiktokAccountAPI.deleteTiktokAccount(id);
			message.success(res?.message || 'TikTok account deleted successfully');
			dispatch(fetchAllTiktokAccounts(params));
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to delete TikTok account');
		}
	};

	const handleStatusChange = async (id: number | string, newStatus: string) => {
		try {
			const res = await tiktokAccountAPI.updateTiktokAccountStatus(id, newStatus);
			message.success(res?.message || `Account status updated to ${newStatus}`);
			dispatch(fetchAllTiktokAccounts(params));
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to update account status');
		}
	};

	return (
		<ListLayout
			title="TikTok Accounts"
			subtitle="Manage and monitor accounts collected from TikTok."
			onAdd={can({ module: 'tiktok_account', action: 'create' }) ? '/tiktok-account/create' : undefined}
			addText="Create Account"
			cardTitle="TikTok Accounts List"
			showSearch
			searchPlaceholder="Search by username, nickname, bio..."
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
						{ label: 'Banned', value: 'banned' },
					],
					initialValue: params.status,
					onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
				},
			]}
			onResetFilters={() => dispatch(resetParams())}
			onRefresh={() => dispatch(fetchAllTiktokAccounts(params))}
			refreshing={loading}
			columns={columnConfig}
			data={accounts}
			loading={loading}
			pagination={pagination}
			onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}
			renderColumns={{
				id: (id) => <span style={{ fontWeight: 500, color: '#1677ff' }}>#{id}</span>,
				username: (_, record) => <AccountColumn username={record.username} nickname={record.nickname} imgPath={record.avatar_path || record.avatar_url} />,
				status: (status, record) => (
					<StatusDropdown
						status={status}
						module="tiktok_account"
						onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
						options={[
							{ value: 'active', label: 'Set as Active' },
							{ value: 'inactive', label: 'Set as Inactive' },
							{ value: 'banned', label: 'Ban Account', danger: true },
						]}
					/>
				),
				followers_count: (val) => formatNumber(val),
				following_count: (val) => formatNumber(val),
				likes_count: (val) => formatNumber(val),
				crawled_at: (val) => formatDateTime(val),
				action: (_, record) => (
					<Space size={4}>
						<PermissionGate module="tiktok_account" action="view">
							<Tooltip title="View Detail">
								<Link to={`/tiktok-account/${record.id}`}>
									<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
								</Link>
							</Tooltip>
						</PermissionGate>

						<PermissionGate module="tiktok_account" action="edit">
							<Tooltip title="Edit Account">
								<Link to={`/tiktok-account/${record.id}/edit`}>
									<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
								</Link>
							</Tooltip>
						</PermissionGate>

						<PermissionGate module="tiktok_account" action="delete">
							<Popconfirm
								title="Delete TikTok account"
								description="Are you sure you want to delete this account?"
								onConfirm={() => handleDelete(record.id)}
								okText="Delete"
								cancelText="Cancel"
								okButtonProps={{ danger: true }}
							>
								<Tooltip title="Delete Account">
									<Button type="text" danger size="small" icon={<DeleteOutlined />} />
								</Tooltip>
							</Popconfirm>
						</PermissionGate>
					</Space>
				),
			}}
		/>
	);
}
