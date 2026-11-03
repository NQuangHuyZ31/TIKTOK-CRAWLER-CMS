import React from 'react';
import { Alert, Space } from 'antd';
import PageHeader from '@core/components/PageHeader';
import SpinComponent from '@core/components/SpinComponent';
import TiktokVideoTable from '@core/components/TiktokVideoTable';
import { fetchCrawlJobDetail, fetchJobResults } from '../store/crawlJob/crawlJobThunks';
import {
	setJobResultsParams,
	resetJobResultsParams,
	setJobVideoResultsParams,
	resetJobVideoResultsParams,
} from '../store/crawlJob/crawlJobSlice';
import JobDetailHeader from '../components/detail/JobDetailHeader';
import JobDetailDescriptions from '../components/detail/JobDetailDescriptions';
import JobDetailTabs from '../components/detail/JobDetailTabs';
import AccountResultsTab from '../components/detail/AccountResultsTab';
import { useJobDetailData } from '../components/detail/useJobDetailData';

export default function CrawlJobDetailPage() {
	const {
		id,
		navigate,
		dispatch,
		activeTab,
		setActiveTab,
		stopping,
		deleting,
		job,
		loading,
		error,
		results,
		resultsLoading,
		pagination,
		params,
		videoResults,
		videosLoading,
		videoPagination,
		videoParams,
		handleStop,
		handleDelete,
	} = useJobDetailData();

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
						dispatch(fetchJobResults({ id, params: videoParams }));
					}}
				/>
			)}
		</Space>
	);
}
