import React, { useEffect, useState } from 'react';
import { Alert, Space, Tag } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import useAction from '@core/hooks/useAction';
import PageHeader from '@core/components/PageHeader';
import SpinComponent from '@core/components/SpinComponent';
import TiktokVideoTable from '@core/components/TiktokVideoTable';
import crawlJobAPI from '../Action/crawlJob';
import { fetchCrawlJobDetail, fetchJobResults, fetchJobVideoResults } from '../store/crawlJob/crawlJobThunks';
import {
	setJobResultsParams,
	resetJobResultsParams,
	setJobVideoResultsParams,
	resetJobVideoResultsParams,
	clearCurrentJobDetail,
} from '../store/crawlJob/crawlJobSlice';
import JobDetailHeader from '../components/detail/JobDetailHeader';
import JobDetailDescriptions from '../components/detail/JobDetailDescriptions';
import JobDetailTabs from '../components/detail/JobDetailTabs';
import AccountResultsTab from '../components/detail/AccountResultsTab';

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

	useEffect(() => {
		if (id) dispatch(fetchCrawlJobDetail({ id }));
		return () => {
			dispatch(clearCurrentJobDetail());
		};
	}, [id, dispatch]);

	useEffect(() => {
		if (id && activeTab === 'accounts') dispatch(fetchJobResults({ id, params }));
	}, [id, activeTab, params, dispatch]);

	useEffect(() => {
		if (id && activeTab === 'videos') dispatch(fetchJobVideoResults({ id, params: videoParams }));
	}, [id, activeTab, videoParams, dispatch]);

	const isWaiting = (job?.status === 'running' || job?.status === 'queued') && String(job?.error_message || '').includes('waiting for service');
	const isJobActive = (job?.status === 'running' || job?.status === 'queued') && !isWaiting;

	useEffect(() => {
		if (!id || !isJobActive) return;
		const interval = setInterval(() => {
			dispatch(fetchCrawlJobDetail({ id, silent: true }));
			if (activeTab === 'accounts') dispatch(fetchJobResults({ id, params, silent: true }));
			else dispatch(fetchJobVideoResults({ id, params: videoParams, silent: true }));
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

	if (loading && !job) return <SpinComponent />;
	if (error) return <Alert type="error" message={error} showIcon />;

	return (
		<Space direction="vertical" size={20} style={{ width: '100%' }}>
			<PageHeader
				title={`Crawl Job Detail #${job?.id ?? id}`}
				subtitle="Track progress, account metrics, and video statistics of the crawl session."
				onBack={() => navigate('/crawler/crawl-job')}
				extra={<JobDetailHeader job={job} stopping={stopping} deleting={deleting} onStop={handleStop} onDelete={handleDelete} />}
			/>

			<JobDetailDescriptions job={job} />

			<JobDetailTabs
				activeTab={activeTab}
				onChange={setActiveTab}
				totalAccounts={pagination.total}
				totalVideos={job?.total_videos_crawled ?? videoPagination.total}
			/>

			{activeTab === 'accounts' ? (
				<AccountResultsTab
					data={results}
					loading={resultsLoading}
					pagination={pagination}
					params={params}
					onParamChange={(key, val) => dispatch(setJobResultsParams({ [key]: val, page: 1 }))}
					onResetParams={() => dispatch(resetJobResultsParams())}
					onPageChange={(page, per_page) => dispatch(setJobResultsParams({ page, per_page }))}
					onRefresh={() => {
						if (!id) return;
						dispatch(fetchCrawlJobDetail({ id }));
						dispatch(fetchJobResults({ id, params }));
					}}
					onSelectUserVideos={(username) => {
						setActiveTab('videos');
						dispatch(setJobVideoResultsParams({ username, page: 1 }));
					}}
				/>
			) : (
				<TiktokVideoTable
					data={videoResults}
					loading={videosLoading}
					pagination={videoPagination}
					filters={videoParams}
					onFilterChange={(key, val) => dispatch(setJobVideoResultsParams({ [key]: val, page: 1 }))}
					onResetFilters={() => dispatch(resetJobVideoResultsParams())}
					onPageChange={(page, per_page) => dispatch(setJobVideoResultsParams({ page, per_page }))}
					onRefresh={() => {
						if (!id) return;
						dispatch(fetchCrawlJobDetail({ id }));
						dispatch(fetchJobVideoResults({ id, params: videoParams }));
					}}
					showAccount={true}
					showVideoId={true}
					showDeltas={true}
					showMusic={false}
					cardTitle="Video Crawl Results & Growth Deltas"
					searchPlaceholder="Search by video ID, caption, username..."
					extra={videoParams.username ? <Tag closable color="blue" onClose={() => dispatch(setJobVideoResultsParams({ username: undefined, page: 1 }))}>Filtered by @{videoParams.username}</Tag> : null}
				/>
			)}
		</Space>
	);
}
