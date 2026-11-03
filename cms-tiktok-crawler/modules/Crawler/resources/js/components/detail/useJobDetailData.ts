import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import useAction from '@core/hooks/useAction';
import crawlJobAPI from '../../Action/crawlJob';
import { fetchCrawlJobDetail, fetchJobResults, fetchJobVideoResults } from '../../store/crawlJob/crawlJobThunks';
import {
	clearCurrentJobDetail,
} from '../../store/crawlJob/crawlJobSlice';

export function useJobDetailData() {
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

	return {
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
	};
}
