import { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert, Radio, Space, Tag } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import useAction from '@core/hooks/useAction';
import ListLayout from '@core/components/ListLayout';
import SpinComponent from '@core/components/SpinComponent';
import { formatNumber } from '@core/utils/formatNumber';
import crawlJobAPI from '../Action/crawlJob';
import { crawlResultColumnConfig, crawlVideoResultColumnConfig } from '../configs/tableConfig';
import {
	CRAWL_RESULT_STATUS_FILTER_OPTIONS,
	FOLLOWER_PRESETS,
	FOLLOWING_PRESETS,
	LIKE_PRESETS,
} from '../configs/crawlerOptions';
import JobDetailHeader from '../components/detail/JobDetailHeader';
import JobDetailDescriptions from '../components/detail/JobDetailDescriptions';
import { createAccountColumnRenderers, createVideoColumnRenderers } from '../components/detail/JobResultRenderers';

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

interface VideoFilterParams {
	page: number;
	per_page: number;
	search?: string;
	username?: string;
	play_count?: string;
	digg_count?: string;
	published_at?: string;
}

const INITIAL_PARAMS: ResultFilterParams = { page: 1, per_page: 10 };
const INITIAL_VIDEO_PARAMS: VideoFilterParams = { page: 1, per_page: 10 };

export default function CrawlJobDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [job, setJob] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'accounts' | 'videos'>('accounts');
	const { act: actDelete, loading: deleting } = useAction();
	const { act: actStop, loading: stopping } = useAction();

	const [results, setResults] = useState<any[]>([]);
	const [resultsLoading, setResultsLoading] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0 });
	const [params, setParams] = useState<ResultFilterParams>(INITIAL_PARAMS);

	const [videoResults, setVideoResults] = useState<any[]>([]);
	const [videosLoading, setVideosLoading] = useState(false);
	const [videoPagination, setVideoPagination] = useState({ page: 1, per_page: 10, total: 0 });
	const [videoParams, setVideoParams] = useState<VideoFilterParams>(INITIAL_VIDEO_PARAMS);

	const updateParams = (patch: Partial<ResultFilterParams>) => setParams((prev) => ({ ...prev, ...patch }));
	const updateVideoParams = (patch: Partial<VideoFilterParams>) => setVideoParams((prev) => ({ ...prev, ...patch }));

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

	const loadResults = useCallback(async (queryParams: ResultFilterParams, silent = false) => {
		if (!id) return;
		if (!silent) setResultsLoading(true);
		try {
			const res: any = await crawlJobAPI.getResults(id, queryParams);
			const responseData = res?.data ?? res;
			setResults(responseData?.data ?? []);
			setPagination({
				page: responseData?.current_page ?? 1,
				per_page: responseData?.per_page ?? 10,
				total: responseData?.total ?? 0,
			});
		} finally {
			if (!silent) setResultsLoading(false);
		}
	}, [id]);

	const loadVideoResults = useCallback(async (queryParams: VideoFilterParams, silent = false) => {
		if (!id) return;
		if (!silent) setVideosLoading(true);
		try {
			const res: any = await crawlJobAPI.getVideoResults(id, queryParams);
			const responseData = res?.data ?? res;
			setVideoResults(responseData?.data ?? []);
			setVideoPagination({
				page: responseData?.current_page ?? 1,
				per_page: responseData?.per_page ?? 10,
				total: responseData?.total ?? 0,
			});
		} finally {
			if (!silent) setVideosLoading(false);
		}
	}, [id]);

	useEffect(() => { loadJobDetail(); }, [loadJobDetail]);
	useEffect(() => { loadResults(params); }, [loadResults, params]);
	useEffect(() => {
		if (activeTab === 'videos') loadVideoResults(videoParams);
	}, [activeTab, loadVideoResults, videoParams]);

	const isWaitingForServiceRestart =
		(job?.status === 'running' || job?.status === 'queued') &&
		String(job?.error_message || '').includes('waiting for service');
	const isJobActive = (job?.status === 'running' || job?.status === 'queued') && !isWaitingForServiceRestart;

	useEffect(() => {
		if (!isJobActive) return;
		const interval = setInterval(() => {
			loadJobDetail();
			if (activeTab === 'accounts') loadResults(params, true);
			else loadVideoResults(videoParams, true);
		}, 5000);
		return () => clearInterval(interval);
	}, [isJobActive, activeTab, loadJobDetail, loadResults, loadVideoResults, params, videoParams]);

	const handleStop = () => {
		if (!id) return;
		actStop(() => crawlJobAPI.stopCrawlJobByID(id), 'Crawl job stopped successfully', () => {
			loadJobDetail();
			loadResults(params, true);
		});
	};

	const handleDelete = () => {
		if (!id) return;
		actDelete(() => crawlJobAPI.deleteCrawlJobByID(id), 'Crawl job deleted successfully', () => navigate('/crawler/crawl-job'));
	};

	const accountRenderers = useMemo(() => createAccountColumnRenderers((username) => {
		setActiveTab('videos');
		updateVideoParams({ username, page: 1 });
	}), []);

	const videoRenderers = useMemo(() => createVideoColumnRenderers(), []);

	if (loading) return <SpinComponent />;
	if (error) return <Alert type="error" message={error} showIcon />;

	return (
		<ListLayout
			title={`Crawl Job Detail #${job?.id ?? id}`}
			subtitle="Track progress, account metrics, and video statistics of the crawl session."
			onBack={() => navigate('/crawler/crawl-job')}
			extra={<JobDetailHeader job={job} stopping={stopping} deleting={deleting} onStop={handleStop} onDelete={handleDelete} />}
			topContent={
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<JobDetailDescriptions job={job} />
					<Space style={{ justifyContent: 'space-between', width: '100%' }}>
						<Radio.Group value={activeTab} onChange={(e) => setActiveTab(e.target.value)} optionType="button" buttonStyle="solid">
							<Radio.Button value="accounts">
								<UserOutlined /> Accounts ({formatNumber(pagination.total)})
							</Radio.Button>
							<Radio.Button value="videos">
								<VideoCameraOutlined /> Videos ({formatNumber(job?.total_videos_crawled ?? videoPagination.total)})
							</Radio.Button>
						</Radio.Group>
						{activeTab === 'videos' && videoParams.username && (
							<Tag closable color="blue" onClose={() => updateVideoParams({ username: undefined, page: 1 })}>
								Filtered by @{videoParams.username}
							</Tag>
						)}
					</Space>
				</div>
			}
			cardTitle={activeTab === 'accounts' ? 'Account Crawl Results' : 'Video Crawl Results & Growth Deltas'}
			showSearch
			searchPlaceholder={activeTab === 'accounts' ? 'Search by username, profile URL, error...' : 'Search by video ID, username, caption...'}
			searchValue={activeTab === 'accounts' ? params.search : videoParams.search}
			onSearch={(keyword) => activeTab === 'accounts' ? updateParams({ search: keyword, page: 1 }) : updateVideoParams({ search: keyword, page: 1 })}
			filters={
				activeTab === 'accounts'
					? [
							{ key: 'status', placeholder: 'All statuses', options: CRAWL_RESULT_STATUS_FILTER_OPTIONS, initialValue: params.status, onChange: (val) => updateParams({ status: val, page: 1 }) },
							{ key: 'followers_count', placeholder: 'Followers', type: 'numberRange', presets: FOLLOWER_PRESETS, initialValue: params.followers_count, onChange: (val) => updateParams({ followers_count: val, page: 1 }) },
							{ key: 'following_count', placeholder: 'Following', type: 'numberRange', presets: FOLLOWING_PRESETS, initialValue: params.following_count, onChange: (val) => updateParams({ following_count: val, page: 1 }) },
							{ key: 'likes_count', placeholder: 'Likes', type: 'numberRange', presets: LIKE_PRESETS, initialValue: params.likes_count, onChange: (val) => updateParams({ likes_count: val, page: 1 }) },
							{ key: 'crawled_at', placeholder: 'Crawled at', type: 'date', initialValue: params.crawled_at ? dayjs(params.crawled_at) : undefined, onChange: (val) => updateParams({ crawled_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined, page: 1 }) },
					  ]
					: [
							{ key: 'play_count', placeholder: 'Views', type: 'numberRange', presets: FOLLOWER_PRESETS, initialValue: videoParams.play_count, onChange: (val) => updateVideoParams({ play_count: val, page: 1 }) },
							{ key: 'digg_count', placeholder: 'Likes', type: 'numberRange', presets: LIKE_PRESETS, initialValue: videoParams.digg_count, onChange: (val) => updateVideoParams({ digg_count: val, page: 1 }) },
							{ key: 'published_at', placeholder: 'Published at', type: 'date', initialValue: videoParams.published_at ? dayjs(videoParams.published_at) : undefined, onChange: (val) => updateVideoParams({ published_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined, page: 1 }) },
					  ]
			}
			onResetFilters={() => (activeTab === 'accounts' ? setParams(INITIAL_PARAMS) : setVideoParams(INITIAL_VIDEO_PARAMS))}
			onRefresh={() => {
				loadJobDetail();
				if (activeTab === 'accounts') loadResults(params);
				else loadVideoResults(videoParams);
			}}
			refreshing={activeTab === 'accounts' ? resultsLoading : videosLoading}
			columns={activeTab === 'accounts' ? crawlResultColumnConfig : crawlVideoResultColumnConfig}
			data={activeTab === 'accounts' ? results : videoResults}
			loading={activeTab === 'accounts' ? resultsLoading : videosLoading}
			pagination={activeTab === 'accounts' ? pagination : videoPagination}
			onPageChange={(page, per_page) => (activeTab === 'accounts' ? updateParams({ page, per_page }) : updateVideoParams({ page, per_page }))}
			renderColumns={activeTab === 'accounts' ? accountRenderers : videoRenderers}
		/>
	);
}
