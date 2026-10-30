import { useEffect, useState, useCallback } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Popconfirm, Space } from 'antd';
import { DeleteOutlined, EditOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import useAction from '@core/hooks/useAction';
import ListLayout from '@core/components/ListLayout';
import StatusTag from '@core/components/StatusTag';
import SpinComponent from '@core/components/SpinComponent';
import PermissionGate from '@core/components/PermissionGate';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import crawlJobAPI from '../Action/crawlJob';
import { crawlResultColumnConfig } from '../configs/tableConfig';
import {
	CRAWL_RESULT_STATUS_FILTER_OPTIONS,
	FOLLOWER_PRESETS,
	FOLLOWING_PRESETS,
	LIKE_PRESETS,
} from '../configs/crawlerOptions';

interface ResultFilterParams {
	page: number;
	per_page: number;
	search?: string;
	status?: string;
	followers_count?: string;
	following_count?: string;
	likes_count?: string;
	crawled_at?: string;
}

const INITIAL_PARAMS: ResultFilterParams = {
	page: 1,
	per_page: 10,
};

export default function CrawlJobDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	// Local states for Job Detail
	const [job, setJob] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { act: actDelete, loading: deleting } = useAction();
	const { act: actStop, loading: stopping } = useAction();

	// Local states for Crawl Results & ListLayout Filters
	const [results, setResults] = useState<any[]>([]);
	const [resultsLoading, setResultsLoading] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0 });
	const [params, setParams] = useState<ResultFilterParams>(INITIAL_PARAMS);

	const updateParams = (patch: Partial<ResultFilterParams>) => {
		setParams((prev) => ({ ...prev, ...patch }));
	};

	// 1. Fetch Crawl Job details
	const loadJobDetail = useCallback(async () => {
		if (!id) return;
		try {
			const res: any = await crawlJobAPI.getCrawlJobByID(id);
			setJob(res?.data ?? res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load crawl job details');
		} finally {
			setLoading(false);
		}
	}, [id]);

	// 2. Fetch Crawl Results with search & filters
	const loadResults = useCallback(
		async (queryParams: ResultFilterParams, silent = false) => {
			if (!id) return;
			if (!silent) {
				setResultsLoading(true);
			}
			try {
				const res: any = await crawlJobAPI.getResults(id, queryParams);
				setResults(res?.data ?? []);
				setPagination({
					page: res?.meta?.current_page ?? queryParams.page,
					per_page: res?.meta?.per_page ?? queryParams.per_page,
					total: res?.meta?.total ?? (Array.isArray(res?.data) ? res.data.length : 0),
				});
			} catch {
				// Error loading results silently handled
			} finally {
				if (!silent) {
					setResultsLoading(false);
				}
			}
		},
		[id],
	);

	useEffect(() => {
		loadJobDetail();
	}, [loadJobDetail]);

	useEffect(() => {
		loadResults(params);
	}, [loadResults, params]);

	const isWaitingForServiceRestart =
		(job?.status === 'running' || job?.status === 'queued') &&
		String(job?.error_message || '').includes('waiting for service');
	const isJobActive = (job?.status === 'running' || job?.status === 'queued') && !isWaitingForServiceRestart;

	useEffect(() => {
		if (!isJobActive) return;
		const interval = setInterval(() => {
			loadJobDetail();
			loadResults(params, true);
		}, 5000);

		return () => clearInterval(interval);
	}, [isJobActive, loadJobDetail, loadResults, params]);

	// 3. Stop Crawl Job
	const handleStop = () => {
		if (!id) return;
		actStop(
			() => crawlJobAPI.stopCrawlJobByID(id),
			'Crawl job stopped successfully',
			() => {
				loadJobDetail();
				loadResults(params, true);
			},
		);
	};

	// 4. Delete Crawl Job directly via API
	const handleDelete = () => {
		if (!id) return;
		actDelete(
			() => crawlJobAPI.deleteCrawlJobByID(id),
			'Crawl job deleted successfully',
			() => navigate('/crawler/crawl-job'),
		);
	};

	if (loading) {
		return <SpinComponent />;
	}

	if (error) {
		return <Alert type="error" message={error} showIcon />;
	}

	const createdByDisplay = job?.creator?.name || job?.created_by_name || '-';
	const startedByDisplay = job?.starter?.name || job?.started_by_name || '-';

	return (
		<ListLayout
			title={`Crawl Job Detail #${job?.id ?? id}`}
			subtitle="Track progress and results of the crawl session."
			onBack={() => navigate('/crawler/crawl-job')}
			extra={
				<Space>
					{job?.status === 'pending' && (
						<PermissionGate module="crawler" action="edit">
							<Button icon={<EditOutlined />} onClick={() => navigate(`/crawler/crawl-job/${job.id}/edit`)}>
								Edit
							</Button>
						</PermissionGate>
					)}
					{(job?.status === 'running' || job?.status === 'queued') && (
						<PermissionGate module="crawler" action="edit">
							<Popconfirm
								title="Stop crawl job"
								description="Are you sure you want to stop this crawl job?"
								onConfirm={handleStop}
								okText="Stop"
								cancelText="Cancel"
								okButtonProps={{ danger: true, loading: stopping }}
							>
								<Button danger icon={<StopOutlined />} loading={stopping}>
									Stop Job
								</Button>
							</Popconfirm>
						</PermissionGate>
					)}
					{job?.status !== 'running' && (
						<PermissionGate module="crawler" action="delete">
							<Popconfirm
								title="Delete crawl job"
								description="Are you sure you want to delete this crawl job?"
								onConfirm={handleDelete}
								okText="Delete"
								cancelText="Cancel"
								okButtonProps={{ danger: true, loading: deleting }}
							>
								<Button danger icon={<DeleteOutlined />} loading={deleting}>
									Delete
								</Button>
							</Popconfirm>
						</PermissionGate>
					)}
				</Space>
			}
			topContent={
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					{isWaitingForServiceRestart && (
						<Alert
							type="warning"
							showIcon
							message="Crawler service has shut down — waiting for service restart to resume (Crash Recovery)"
							description={job?.error_message}
						/>
					)}
					<Card>
						<Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
							<Descriptions.Item label="Status">
								<StatusTag status={job?.status} />
							</Descriptions.Item>
							<Descriptions.Item label="Total Accounts">{formatNumber(job?.total_account ?? 0)}</Descriptions.Item>
							<Descriptions.Item label="Success">{formatNumber(job?.success_count ?? 0)}</Descriptions.Item>
							<Descriptions.Item label="Failed">{formatNumber(job?.failed_count ?? 0)}</Descriptions.Item>
							<Descriptions.Item label="Created By">{createdByDisplay}</Descriptions.Item>
							<Descriptions.Item label="Started By">{startedByDisplay}</Descriptions.Item>
							<Descriptions.Item label="Started At">{formatDateTime(job?.started_at) || '-'}</Descriptions.Item>
							<Descriptions.Item label="Finished At">{formatDateTime(job?.finished_at) || '-'}</Descriptions.Item>
							<Descriptions.Item label="Duration">{job?.duration ? `${job?.duration}s` : '-'}</Descriptions.Item>
							<Descriptions.Item label="Error Message" span={3}>
								{job?.error_message || '-'}
							</Descriptions.Item>
						</Descriptions>
					</Card>
				</div>
			}
			cardTitle="Crawl Results"
			showSearch
			searchPlaceholder="Search by username, profile URL, error..."
			searchValue={params.search}
			onSearch={(keyword) => updateParams({ search: keyword, page: 1 })}
			filters={[
				{
					key: 'status',
					placeholder: 'All statuses',
					options: CRAWL_RESULT_STATUS_FILTER_OPTIONS,
					initialValue: params.status,
					onChange: (val) => updateParams({ status: val, page: 1 }),
				},
				{
					key: 'followers_count',
					placeholder: 'Followers',
					type: 'numberRange',
					presets: FOLLOWER_PRESETS,
					initialValue: params.followers_count,
					onChange: (val) => updateParams({ followers_count: val, page: 1 }),
				},
				{
					key: 'following_count',
					placeholder: 'Following',
					type: 'numberRange',
					presets: FOLLOWING_PRESETS,
					initialValue: params.following_count,
					onChange: (val) => updateParams({ following_count: val, page: 1 }),
				},
				{
					key: 'likes_count',
					placeholder: 'Likes',
					type: 'numberRange',
					presets: LIKE_PRESETS,
					initialValue: params.likes_count,
					onChange: (val) => updateParams({ likes_count: val, page: 1 }),
				},
				{
					key: 'crawled_at',
					placeholder: 'Crawled at',
					type: 'date',
					initialValue: params.crawled_at ? dayjs(params.crawled_at) : undefined,
					onChange: (val) =>
						updateParams({
							crawled_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined,
							page: 1,
						}),
				},
			]}
			onResetFilters={() => setParams(INITIAL_PARAMS)}
			onRefresh={() => {
				loadJobDetail();
				loadResults(params);
			}}
			refreshing={resultsLoading}
			columns={crawlResultColumnConfig}
			data={results}
			loading={resultsLoading}
			pagination={pagination}
			onPageChange={(page, per_page) => updateParams({ page, per_page })}
			renderColumns={{
				avatar_path: (val) => <Avatar size={40} src={val || undefined} icon={<UserOutlined />} />,
				username: (val) => (val ? <span style={{ fontWeight: 500 }}>@{val}</span> : '-'),
				status: (status) => <StatusTag status={status} />,
				followers_count: (val) => formatNumber(val),
				following_count: (val) => formatNumber(val),
				likes_count: (val) => formatNumber(val),
				crawled_at: (val) => formatDateTime(val),
				profile_url: (text: string) =>
					text ? (
						<Link to={text} target="_blank" rel="noopener noreferrer">
							{text}
						</Link>
					) : (
						'-'
					),
			}}
		/>
	);
}
