import { useEffect } from 'react';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@core/components/ListLayout';
import StatusDropdown from '@core/components/StatusDropdown';
import usePermission from '@core/hooks/usePermission';
import useAction from '@core/hooks/useAction';
import { TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS } from '../configs/accountOptions';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchAllTiktokAccounts } from '../store/tiktokAccount/tiktokAccountThunks';
import { setParams, resetParams } from '../store/tiktokAccount/tiktokAccountSlice';
import tiktokAccountAPI, { type TiktokAccountItem } from '../Action/tiktokAccount';
import columnConfig from '../configs/columnConfig';
import AccountColumn from '../components/AccountColumn';
import { buildAccountFilters } from '../configs/accountFilterConfig';
import AccountTableActions from '../components/accountList/AccountTableActions';

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

	const filters = buildAccountFilters(params, (key, value) => {
		dispatch(setParams({ [key]: value, page: 1 }));
	});

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
			filters={filters}
			onResetFilters={() => dispatch(resetParams())}
			onRefresh={() => dispatch(fetchAllTiktokAccounts(params))}
			refreshing={loading}
			columns={columnConfig}
			data={accounts}
			loading={loading}
			pagination={pagination}
			onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}
			renderColumns={{
				id: (id: any) => <span style={{ fontWeight: 500, color: '#1677ff' }}>#{id}</span>,
				username: (_: any, record: TiktokAccountItem) => (
					<AccountColumn username={record.username} nickname={record.nickname} imgPath={record.avatar_path} />
				),
				status: (status: string, record: TiktokAccountItem) => (
					<StatusDropdown
						status={status}
						module="tiktok_account"
						onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
						options={TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS}
					/>
				),
				followers_count: (val: number) => formatNumber(val),
				following_count: (val: number) => formatNumber(val),
				likes_count: (val: number) => formatNumber(val),
				crawled_at: (val: string) => formatDateTime(val),
				action: (_: any, record: TiktokAccountItem) => (
					<AccountTableActions record={record} onDelete={handleDelete} />
				),
			}}
		/>
	);
}
