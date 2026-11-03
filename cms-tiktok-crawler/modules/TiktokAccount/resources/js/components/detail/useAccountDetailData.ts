import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAction from '@core/hooks/useAction';
import type { VideoFilterValues } from '@core/components/TiktokVideoTable';
import tiktokAccountAPI from '../../Action/tiktokAccount';

export function useAccountDetailData(id?: string) {
	const navigate = useNavigate();
	const [account, setAccount] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { act, loading: deleting } = useAction();

	// Crawl history state
	const [historyData, setHistoryData] = useState<any[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyPagination, setHistoryPagination] = useState({ page: 1, per_page: 10, total: 0 });

	// Videos state
	const [videosData, setVideosData] = useState<any[]>([]);
	const [videosLoading, setVideosLoading] = useState(false);
	const [videosPagination, setVideosPagination] = useState({ page: 1, per_page: 10, total: 0 });
	const [videoFilters, setVideoFilters] = useState<VideoFilterValues>({});

	const loadAccount = useCallback(async () => {
		if (!id) return;
		try {
			const res: any = await tiktokAccountAPI.getTiktokAccountByID(id);
			setAccount(res?.data ?? res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load account details');
		} finally {
			setLoading(false);
		}
	}, [id]);

	const loadHistory = useCallback(async (page = 1, perPage = 10) => {
		if (!id) return;
		setHistoryLoading(true);
		try {
			const res: any = await tiktokAccountAPI.getResults(id, { page, per_page: perPage });
			setHistoryData(res?.data ?? []);
			setHistoryPagination({
				page: res?.meta?.current_page ?? page,
				per_page: res?.meta?.per_page ?? perPage,
				total: res?.meta?.total ?? 0,
			});
		} catch {
			// Silently handled
		} finally {
			setHistoryLoading(false);
		}
	}, [id]);

	const loadVideos = useCallback(async (page = 1, perPage = 10, currentFilters: VideoFilterValues = {}) => {
		if (!id) return;
		setVideosLoading(true);
		try {
			const res: any = await tiktokAccountAPI.getVideos(id, {
				page,
				per_page: perPage,
				...currentFilters,
			});
			setVideosData(res?.data ?? []);
			setVideosPagination({
				page: res?.meta?.current_page ?? page,
				per_page: res?.meta?.per_page ?? perPage,
				total: res?.meta?.total ?? 0,
			});
		} catch {
			// Silently handled
		} finally {
			setVideosLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadAccount();
		loadHistory(1, 10);
	}, [loadAccount, loadHistory]);

	useEffect(() => {
		loadVideos(1, videosPagination.per_page, videoFilters);
	}, [loadVideos, videoFilters]);

	const handleFilterChange = (key: string, value: any) => {
		setVideoFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleResetFilters = () => {
		setVideoFilters({});
	};

	const handleDelete = () => {
		if (!id) return;
		act(
			() => tiktokAccountAPI.deleteTiktokAccount(id),
			'Account deleted successfully',
			() => navigate('/tiktok-account'),
		);
	};

	return {
		account,
		loading,
		error,
		deleting,
		handleDelete,
		historyData,
		historyLoading,
		historyPagination,
		loadHistory,
		videosData,
		videosLoading,
		videosPagination,
		videoFilters,
		handleFilterChange,
		handleResetFilters,
		loadVideos,
	};
}
