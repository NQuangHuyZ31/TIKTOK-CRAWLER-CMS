import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Space } from 'antd';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/layouts/ListLayout';
import StatusTag from '@core/components/StatusTag';
import { fechAllTiktokAccounts } from '../store/tiktokAccount/tiktokAccountThunks';
import { setParams } from '../store/tiktokAccount/tiktokAccountSlice';
import columnConfig from '../configs/columnConfig';
import AccountColumn from '../components/AccountColumn';
import DeleteAccount from '../components/DeleteAccount';

export default function TiktokAccountPage() {
	const dispatch = useDispatch();
	const { data: accounts, loading, pagination, params } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fechAllTiktokAccounts(params));
	}, [dispatch, params]);

	return (
		<ListLayout
			title="TikTok Accounts"
			subtitle="Manage and monitor accounts collected from TikTok."
			cardTitle="Account list"
			showSearch
			searchPlaceholder="Search by username, nickname..."
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
					],
					initialValue: params.status,
					onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
				},
			]}
			onResetFilters={() => dispatch(setParams({ search: '', status: '', page: 1 }))}
			onRefresh={() => dispatch(fechAllTiktokAccounts(params))}
			refreshing={loading}
			columns={columnConfig}
			data={accounts}
			loading={loading}
			pagination={pagination}
			onPageChange={(page, pageSize) => dispatch(setParams({ page, per_page: pageSize }))}
			renderColumns={{
				username: (username, record) => <AccountColumn username={username} imgPath={record.avatar_path} />,
				status: (status) => <StatusTag status={status} />,
				action: (_, record) => (
					<Space>
						<Link to={`/tiktok-account/${record.id}`}>Detail</Link>
						<Link to={`/tiktok-account/${record.id}/edit`}>Edit</Link>
						<DeleteAccount accountId={record.id} textOnly redirectOnDelete={false} />
					</Space>
				),
			}}
		/>
	);
}
