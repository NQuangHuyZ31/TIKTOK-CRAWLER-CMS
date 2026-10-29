import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip, InputNumber, Form } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@core/components/ListLayout';
import PermissionGate from '@core/components/PermissionGate';
import StatusDropdown from '@core/components/StatusDropdown';
import usePermission from '@core/hooks/usePermission';
import useAction from '@core/hooks/useAction';
import {
	TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS,
	TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS,
} from '../configs/accountOptions';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchAllTiktokAccounts } from '../store/tiktokAccount/tiktokAccountThunks';
import { setParams, resetParams } from '../store/tiktokAccount/tiktokAccountSlice';
import tiktokAccountAPI from '../Action/tiktokAccount';
import columnConfig from '../configs/columnConfig';
import AccountColumn from '../components/AccountColumn';
import dayjs from 'dayjs';
import { FOLLOWER_PRESETS, FOLLOWING_PRESETS, LIKE_PRESETS } from '../configs/filterPresets';

export default function TiktokAccountPage() {
	const { can } = usePermission();
	const dispatch = useDispatch();
	const { data: accounts, loading, pagination, params } = useSelector((state) => state.tiktokAccount);

	const { act } = useAction(() => dispatch(fetchAllTiktokAccounts(params)));

	useEffect(() => {
		dispatch(fetchAllTiktokAccounts(params));
	}, [dispatch, params]);

	const handleDelete = (id: number | string) => {
		act(() => tiktokAccountAPI.deleteTiktokAccount(id), 'TikTok account deleted successfully');
	};

	const handleStatusChange = (id: number | string, newStatus: string) => {
		act(() => tiktokAccountAPI.updateTiktokAccountStatus(id, newStatus), `Account status updated to ${newStatus}`);
	};

	return (
		<ListLayout
			title="TikTok Accounts"
			subtitle="Manage and monitor accounts collected from TikTok."
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Tiktok Account' }]}
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
					options: TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS,
					initialValue: params.status,
					onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
				},
				{
					key: 'followers_count',
					placeholder: 'Followers',
					type: 'numberRange',
					presets: FOLLOWER_PRESETS,
					initialValue: params.followers_count,
					onChange: (val) => dispatch(setParams({ followers_count: val, page: 1 })),
				},
				{
					key: 'following_count',
					placeholder: 'Following',
					type: 'numberRange',
					presets: FOLLOWING_PRESETS,
					initialValue: params.following_count,
					onChange: (val) => dispatch(setParams({ following_count: val, page: 1 })),
				},
				{
					key: 'likes_count',
					placeholder: 'Likes',
					type: 'numberRange',
					presets: LIKE_PRESETS,
					initialValue: params.likes_count,
					onChange: (val) => dispatch(setParams({ likes_count: val, page: 1 })),
				},
				{
					key: 'crawled_at',
					placeholder: 'Crawled at',
					type: 'date',
					initialValue: params.crawled_at ? dayjs(params.crawled_at) : undefined,
					onChange: (val) =>
						dispatch(
							setParams({
								crawled_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined,
								page: 1,
							}),
						),
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
				username: (_, record) => <AccountColumn username={record.username} nickname={record.nickname} imgPath={record.avatar_path} />,
				status: (status, record) => (
					<StatusDropdown
						status={status}
						module="tiktok_account"
						onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
						options={TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS}
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
