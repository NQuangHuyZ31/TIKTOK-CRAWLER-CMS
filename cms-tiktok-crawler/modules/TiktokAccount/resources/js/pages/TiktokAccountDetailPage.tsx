import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Radio, Space } from 'antd';
import {
	HistoryOutlined,
	InfoCircleOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import { formatNumber } from '@core/utils/formatNumber';
import type { VideoFilterValues } from '@core/components/TiktokVideoTable';
import tiktokAccountAPI from '../Action/tiktokAccount';
import AccountDetailHeader from '../components/detail/AccountDetailHeader';
import AccountKpiSection from '../components/detail/AccountKpiSection';
import AccountInfoTab from '../components/detail/AccountInfoTab';
import AccountCrawlHistoryTab from '../components/detail/AccountCrawlHistoryTab';
import AccountVideosTab from '../components/detail/AccountVideosTab';

export default function TiktokAccountDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [account, setAccount] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'videos' | 'history' | 'info'>('videos');
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

	if (loading) return <SpinComponent />;
	if (error) return <Alert type="error" message={error} showIcon />;

	return (
		<Space direction="vertical" size={20} style={{ width: '100%' }}>
			<PageHeader
				title={`Account @${account?.username || id}`}
				subtitle="View account profile details, engagement metrics, crawled videos, and crawl session history."
				onBack={() => navigate('/tiktok-account')}
			/>

			<AccountDetailHeader account={account} deleting={deleting} onDelete={handleDelete} />
			<AccountKpiSection account={account} />

			<Radio.Group
				value={activeTab}
				onChange={(e) => setActiveTab(e.target.value)}
				optionType="button"
				buttonStyle="solid"
				size="middle"
			>
				<Radio.Button value="videos">
					<VideoCameraOutlined /> Videos ({formatNumber(videosPagination.total)})
				</Radio.Button>
				<Radio.Button value="history">
					<HistoryOutlined /> Crawl History ({formatNumber(historyPagination.total)})
				</Radio.Button>
				<Radio.Button value="info">
					<InfoCircleOutlined /> Profile Info
				</Radio.Button>
			</Radio.Group>

			{activeTab === 'videos' && (
				<AccountVideosTab
					data={videosData}
					loading={videosLoading}
					pagination={videosPagination}
					filters={videoFilters}
					onFilterChange={handleFilterChange}
					onResetFilters={handleResetFilters}
					onPageChange={(page, perPage) => loadVideos(page, perPage, videoFilters)}
					onRefresh={() => loadVideos(videosPagination.page, videosPagination.per_page, videoFilters)}
				/>
			)}

			{activeTab === 'history' && (
				<AccountCrawlHistoryTab
					data={historyData}
					loading={historyLoading}
					pagination={historyPagination}
					onPageChange={(page, perPage) => loadHistory(page, perPage)}
					onRefresh={() => loadHistory(historyPagination.page, historyPagination.per_page)}
				/>
			)}

			{activeTab === 'info' && <AccountInfoTab account={account} />}
		</Space>
	);
}
