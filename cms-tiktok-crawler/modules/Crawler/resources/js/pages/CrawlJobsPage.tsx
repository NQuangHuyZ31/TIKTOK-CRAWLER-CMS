import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, App as AntdApp } from 'antd';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/layouts/ListLayout';
import StatusTag from '@core/components/StatusTag';
import { fetchCrawlJobs, fetchStatisticsSummary } from '../store/crawlJob/crawlJobThunks';
import { setParams } from '../store/crawlJob/crawlJobSlice';
import crawlJobAPI from '../Action/crawlJob';
import { crawlJobColumnConfig } from '../configs/tableConfig';

export default function CrawlJobsPage() {
	const { message } = AntdApp.useApp();
	const dispatch = useDispatch();
	const { data: jobs, loading, pagination, params } = useSelector((state) => state.crawlJob);

	useEffect(() => {
		dispatch(fetchCrawlJobs(params));
	}, [dispatch, params]);

	const handleDelete = async (id: number | string) => {
		try {
			const res = await crawlJobAPI.deleteCrawlJobByID(id);
			message.success(res?.message || 'Crawl job deleted successfully');
			dispatch(fetchCrawlJobs(params));
			dispatch(fetchStatisticsSummary());
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to delete crawl job');
		}
	};

	return (
		<ListLayout
			title="Crawl Jobs"
			subtitle="Manage and monitor TikTok crawl jobs."
			onAdd="/crawler/crawl-job/create"
			addText="Create Job"
			cardTitle="Crawl Jobs List"
			showSearch
			searchPlaceholder="Search crawl jobs..."
			searchValue={params.search}
			onSearch={(keyword) => dispatch(setParams({ search: keyword, page: 1 }))}
			filters={[
				{
					key: 'status',
					placeholder: 'All statuses',
					options: [
						{ label: 'All statuses', value: '' },
						{ label: 'Pending', value: 'pending' },
						{ label: 'Running', value: 'running' },
						{ label: 'Completed', value: 'completed' },
						{ label: 'Failed', value: 'failed' },
					],
					initialValue: params.status,
					onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
				},
			]}
			onResetFilters={() => dispatch(setParams({ search: '', status: '', page: 1 }))}
			onRefresh={() => dispatch(fetchCrawlJobs(params))}
			refreshing={loading}
			columns={crawlJobColumnConfig}
			data={jobs}
			loading={loading}
			pagination={pagination}
			onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}
			renderColumns={{
				status: (status) => <StatusTag status={status} />,
				action: (_, record) => (
					<Space>
						<Link to={`/crawler/crawl-job/${record.id}`}>Detail</Link>
						{record.status === 'pending' && <Link to={`/crawler/crawl-job/${record.id}/edit`}>Edit</Link>}
						<Popconfirm
							title="Delete crawl job"
							description="Are you sure you want to delete this crawl job?"
							onConfirm={() => handleDelete(record.id)}
							okText="Delete"
							cancelText="Cancel"
							okButtonProps={{ danger: true }}
						>
							<Button type="link" danger size="small" style={{ padding: 0 }}>
								Delete
							</Button>
						</Popconfirm>
					</Space>
				),
			}}
		/>
	);
}
