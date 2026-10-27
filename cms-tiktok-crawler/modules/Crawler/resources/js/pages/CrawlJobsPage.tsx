import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, RedoOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import ListLayout from '@/components/ListLayout';
import StatusTag from '@core/components/StatusTag';
import PermissionGate from '@core/components/PermissionGate';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchCrawlJobs, fetchStatisticsSummary } from '../store/crawlJob/crawlJobThunks';
import { setParams, resetParams } from '../store/crawlJob/crawlJobSlice';
import crawlJobAPI from '../Action/crawlJob';
import useAction from '@core/hooks/useAction';
import { crawlJobColumnConfig } from '../configs/tableConfig';

export default function CrawlJobsPage() {
	const dispatch = useDispatch();
	const { data: jobs, loading, pagination, params } = useSelector((state) => state.crawlJob);

	const { execute: handleDelete } = useAction(
		(id: number | string) => crawlJobAPI.deleteCrawlJobByID(id),
		'Crawl job deleted successfully',
		() => {
			dispatch(fetchCrawlJobs(params));
			dispatch(fetchStatisticsSummary());
		},
	);

	const { execute: handleStart } = useAction(
		(id: number | string) => crawlJobAPI.startCrawlJobByID(id),
		'Crawl job started successfully',
		() => {
			dispatch(fetchCrawlJobs(params));
			dispatch(fetchStatisticsSummary());
		},
	);

	const { execute: handleRetry } = useAction(
		(id: number | string) => crawlJobAPI.retryCrawlJobByID(id),
		'Crawl job retried successfully',
		() => {
			dispatch(fetchCrawlJobs(params));
			dispatch(fetchStatisticsSummary());
		},
	);

	useEffect(() => {
		dispatch(fetchCrawlJobs(params));
	}, [dispatch, params]);

	return (
		<ListLayout
			title="Crawl Jobs"
			subtitle="Manage and monitor TikTok crawl jobs."
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Crawl Job' }]}
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
					initialValue: params.status ?? undefined,
					onChange: (val) => dispatch(setParams({ status: val, page: 1 })),
				},
				{
					key: 'started_at',
					type: 'date',
					initialValue: params.started_at_from ? dayjs(params.started_at_from) : undefined,
					onChange: (val) =>
						dispatch(
							setParams({
								started_at_from: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined,
								page: 1,
							}),
						),
				},
				{
					key: 'finished_at',
					type: 'date',
					initialValue: params.finished_at_to ? dayjs(params.finished_at_to) : undefined,
					onChange: (val) =>
						dispatch(
							setParams({
								finished_at_to: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined,
								page: 1,
							}),
						),
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
						<PermissionGate module="crawler" action="view">
							<Tooltip title="Detail">
								<Link to={`/crawler/crawl-job/${record.id}`}>
									<Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
								</Link>
							</Tooltip>
						</PermissionGate>
						<PermissionGate module="crawler" action="edit">
							{record.status === 'pending' && (
								<>
									<Tooltip title="Edit">
										<Link to={`/crawler/crawl-job/${record.id}/edit`}>
											<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
										</Link>
									</Tooltip>
									<Popconfirm
										title="Start crawl job"
										description="Are you sure you want to start this crawl job?"
										onConfirm={() => handleStart(record.id)}
										okText="Start"
										cancelText="Cancel"
									>
										<Tooltip title="Start">
											<Button size="small" type="text" icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />} />
										</Tooltip>
									</Popconfirm>
								</>
							)}
							{record.status === 'failed' && (
								<Popconfirm
									title="Retry crawl job"
									description="Are you sure you want to retry this failed crawl job?"
									onConfirm={() => handleRetry(record.id)}
									okText="Retry"
									cancelText="Cancel"
								>
									<Tooltip title="Retry">
										<Button size="small" type="text" icon={<RedoOutlined style={{ color: '#fa8c16' }} />} />
									</Tooltip>
								</Popconfirm>
							)}
						</PermissionGate>
						<PermissionGate module="crawler" action="delete">
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
						</PermissionGate>
					</Space>
				),
			}}
		/>
	);
}
