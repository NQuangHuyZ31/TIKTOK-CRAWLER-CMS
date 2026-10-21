import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip, App as AntdApp } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/layouts/ListLayout';
import StatusTag from '@core/components/StatusTag';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchCrawlJobs, fetchStatisticsSummary } from '../store/crawlJob/crawlJobThunks';
import { setParams, resetParams } from '../store/crawlJob/crawlJobSlice';
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
			onResetFilters={() => dispatch(resetParams())}
			onRefresh={() => dispatch(fetchCrawlJobs(params))}
			refreshing={loading}
			columns={crawlJobColumnConfig}
			data={jobs}
			loading={loading}
			pagination={pagination}
			onPageChange={(page, per_page) => dispatch(setParams({ page, per_page }))}
			renderColumns={{
				id: (id) => <span style={{ fontWeight: 500, color: '#1677ff' }}>#{id}</span>,
				status: (status) => <StatusTag status={status} />,
				total_account: (val) => formatNumber(val),
				success_count: (val) => <span style={{ color: '#52c41a' }}>{formatNumber(val)}</span>,
				failed_count: (val) => (Number(val) > 0 ? <span style={{ color: '#ff4d4f' }}>{formatNumber(val)}</span> : '0'),
				started_at: (val) => formatDateTime(val),
				finished_at: (val) => formatDateTime(val),
				action: (_, record) => (
					<Space size={4}>
						<Tooltip title="Detail">
							<Link to={`/crawler/crawl-job/${record.id}`}>
								<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
							</Link>
						</Tooltip>
						{record.status === 'pending' && (
							<Tooltip title="Edit">
								<Link to={`/crawler/crawl-job/${record.id}/edit`}>
									<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
								</Link>
							</Tooltip>
						)}
						<Popconfirm
							title="Delete crawl job"
							description="Are you sure you want to delete this crawl job?"
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
	);
}

