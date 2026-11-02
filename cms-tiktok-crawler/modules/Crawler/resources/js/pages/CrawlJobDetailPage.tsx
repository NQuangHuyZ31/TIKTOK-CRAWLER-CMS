import { useEffect, useState, useMemo } from 'react';
import { Alert, Radio, Space, Tag } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from '@core/store';
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
import {
	fetchCrawlJobDetail,
	fetchJobResults,
	fetchJobVideoResults,
} from '../store/crawlJob/crawlJobThunks';
import {
	setJobResultsParams,
	resetJobResultsParams,
	setJobVideoResultsParams,
	resetJobVideoResultsParams,
	clearCurrentJobDetail,
} from '../store/crawlJob/crawlJobSlice';
import JobDetailHeader from '../components/detail/JobDetailHeader';
import JobDetailDescriptions from '../components/detail/JobDetailDescriptions';
import { createAccountColumnRenderers, createVideoColumnRenderers } from '../components/detail/JobResultRenderers';

export default function CrawlJobDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [activeTab, setActiveTab] = useState<'accounts' | 'videos'>('accounts');
	const { act: actDelete, loading: deleting } = useAction();
	const { act: actStop, loading: stopping } = useAction();

	const {
		currentJob: job,
		currentJobLoading: loading,
		currentJobError: error,
		jobResults: results,
		jobResultsLoading: resultsLoading,
		jobResultsPagination: pagination,
		jobResultsParams: params,
		jobVideoResults: videoResults,
		jobVideoResultsLoading: videosLoading,
		jobVideoResultsPagination: videoPagination,
		jobVideoResultsParams: videoParams,
	} = useSelector((state) => state.crawlJob);

	// Load job detail on mount
	useEffect(() => {
		if (id) {
			dispatch(fetchCrawlJobDetail({ id }));
		}
		return () => {
			dispatch(clearCurrentJobDetail());
		};
	}, [id, dispatch]);

	// Load account results on tab / params change
	useEffect(() => {
		if (id && activeTab === 'accounts') {
			dispatch(fetchJobResults({ id, params }));
		}
	}, [id, activeTab, params, dispatch]);

	// Load video results on tab / videoParams change
	useEffect(() => {
		if (id && activeTab === 'videos') {
			dispatch(fetchJobVideoResults({ id, params: videoParams }));
		}
	}, [id, activeTab, videoParams, dispatch]);

	const isWaitingForServiceRestart =
		(job?.status === 'running' || job?.status === 'queued') &&
		String(job?.error_message || '').includes('waiting for service');
	const isJobActive = (job?.status === 'running' || job?.status === 'queued') && !isWaitingForServiceRestart;

	// Polling when job is active
	useEffect(() => {
		if (!id || !isJobActive) return;
		const interval = setInterval(() => {
			dispatch(fetchCrawlJobDetail({ id, silent: true }));
			if (activeTab === 'accounts') {
				dispatch(fetchJobResults({ id, params, silent: true }));
			} else {
				dispatch(fetchJobVideoResults({ id, params: videoParams, silent: true }));
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [id, isJobActive, activeTab, params, videoParams, dispatch]);

	const handleStop = () => {
		if (!id) return;
		actStop(() => crawlJobAPI.stopCrawlJobByID(id), 'Crawl job stopped successfully', () => {
			dispatch(fetchCrawlJobDetail({ id }));
			dispatch(fetchJobResults({ id, params, silent: true }));
		});
	};

	const handleDelete = () => {
		if (!id) return;
		actDelete(() => crawlJobAPI.deleteCrawlJobByID(id), 'Crawl job deleted successfully', () => navigate('/crawler/crawl-job'));
	};

	const accountRenderers = useMemo(() => createAccountColumnRenderers((username) => {
		setActiveTab('videos');
		dispatch(setJobVideoResultsParams({ username, page: 1 }));
	}), [dispatch]);

	const videoRenderers = useMemo(() => createVideoColumnRenderers(), []);

	if (loading && !job) return <SpinComponent />;
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
							<Tag closable color="blue" onClose={() => dispatch(setJobVideoResultsParams({ username: undefined, page: 1 }))}>
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
			onSearch={(keyword) =>
				activeTab === 'accounts'
					? dispatch(setJobResultsParams({ search: keyword, page: 1 }))
					: dispatch(setJobVideoResultsParams({ search: keyword, page: 1 }))
			}
			filters={
				activeTab === 'accounts'
					? [
							{ key: 'status', placeholder: 'All statuses', options: CRAWL_RESULT_STATUS_FILTER_OPTIONS, initialValue: params.status, onChange: (val) => dispatch(setJobResultsParams({ status: val, page: 1 })) },
							{ key: 'followers_count', placeholder: 'Followers', type: 'numberRange', presets: FOLLOWER_PRESETS, initialValue: params.followers_count, onChange: (val) => dispatch(setJobResultsParams({ followers_count: val, page: 1 })) },
							{ key: 'following_count', placeholder: 'Following', type: 'numberRange', presets: FOLLOWING_PRESETS, initialValue: params.following_count, onChange: (val) => dispatch(setJobResultsParams({ following_count: val, page: 1 })) },
							{ key: 'likes_count', placeholder: 'Likes', type: 'numberRange', presets: LIKE_PRESETS, initialValue: params.likes_count, onChange: (val) => dispatch(setJobResultsParams({ likes_count: val, page: 1 })) },
							{ key: 'crawled_at', placeholder: 'Crawled at', type: 'date', initialValue: params.crawled_at ? dayjs(params.crawled_at) : undefined, onChange: (val) => dispatch(setJobResultsParams({ crawled_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined, page: 1 })) },
					  ]
					: [
							{ key: 'play_count', placeholder: 'Views', type: 'numberRange', presets: FOLLOWER_PRESETS, initialValue: videoParams.play_count, onChange: (val) => dispatch(setJobVideoResultsParams({ play_count: val, page: 1 })) },
							{ key: 'digg_count', placeholder: 'Likes', type: 'numberRange', presets: LIKE_PRESETS, initialValue: videoParams.digg_count, onChange: (val) => dispatch(setJobVideoResultsParams({ digg_count: val, page: 1 })) },
							{ key: 'published_at', placeholder: 'Published at', type: 'date', initialValue: videoParams.published_at ? dayjs(videoParams.published_at) : undefined, onChange: (val) => dispatch(setJobVideoResultsParams({ published_at: val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : undefined, page: 1 })) },
					  ]
			}
			onResetFilters={() => (activeTab === 'accounts' ? dispatch(resetJobResultsParams()) : dispatch(resetJobVideoResultsParams()))}
			onRefresh={() => {
				if (!id) return;
				dispatch(fetchCrawlJobDetail({ id }));
				if (activeTab === 'accounts') dispatch(fetchJobResults({ id, params }));
				else dispatch(fetchJobVideoResults({ id, params: videoParams }));
			}}
			refreshing={activeTab === 'accounts' ? resultsLoading : videosLoading}
			columns={activeTab === 'accounts' ? crawlResultColumnConfig : crawlVideoResultColumnConfig}
			data={activeTab === 'accounts' ? results : videoResults}
			loading={activeTab === 'accounts' ? resultsLoading : videosLoading}
			pagination={activeTab === 'accounts' ? pagination : videoPagination}
			onPageChange={(page, per_page) =>
				activeTab === 'accounts'
					? dispatch(setJobResultsParams({ page, per_page }))
					: dispatch(setJobVideoResultsParams({ page, per_page }))
			}
			renderColumns={activeTab === 'accounts' ? accountRenderers : videoRenderers}
		/>
	);
}
