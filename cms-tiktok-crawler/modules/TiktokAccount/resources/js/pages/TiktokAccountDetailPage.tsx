import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Radio, Space } from 'antd';
import { HistoryOutlined, InfoCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import { formatNumber } from '@core/utils/formatNumber';
import AccountDetailHeader from '../components/detail/AccountDetailHeader';
import AccountKpiSection from '../components/detail/AccountKpiSection';
import AccountInfoTab from '../components/detail/AccountInfoTab';
import AccountCrawlHistoryTab from '../components/detail/AccountCrawlHistoryTab';
import AccountVideosTab from '../components/detail/AccountVideosTab';
import { useAccountDetailData } from '../components/detail/useAccountDetailData';

export default function TiktokAccountDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'videos' | 'history' | 'info'>('videos');

	const {
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
	} = useAccountDetailData(id);

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
