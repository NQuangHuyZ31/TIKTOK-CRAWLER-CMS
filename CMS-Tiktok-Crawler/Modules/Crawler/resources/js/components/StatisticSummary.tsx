import React, { useEffect } from 'react';
import {
	FileTextOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	TeamOutlined,
	UserDeleteOutlined,
} from '@ant-design/icons';
import { App as AntdApp } from 'antd';
import { useDispatch, useSelector } from '@core/store';
import { fetchStatisticsSummary } from '@modules/Crawler/resources/js/store/crawlJob/crawlJobThunks';
import CardKPI from '@core/components/CardKPI';
import SpinComponent from '@core/components/SpinComponent';


const StatisticSummary = () => {
	const { message } = AntdApp.useApp();

	const dispatch = useDispatch();

	const {
		statistics,
		statisticsLoading,
		statisticsError,
	} = useSelector((state) => state.crawlJob);

	useEffect(() => {
		dispatch(fetchStatisticsSummary());
	}, [dispatch]);

	useEffect(() => {
		if (statisticsError) {
			message.error(statisticsError);
		}
	}, [message, statisticsError]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<CardKPI
				title="Total Jobs"
				value={statistics?.total_jobs ?? 0}
				icon={<FileTextOutlined />}
				color="blue"
			/>

			<CardKPI
				title="Success Jobs"
				value={statistics?.total_completed_jobs ?? 0}
				icon={<CheckCircleOutlined />}
				color="green"
			/>

			<CardKPI
				title="Failed Jobs"
				value={statistics?.total_failed_jobs ?? 0}
				icon={<CloseCircleOutlined />}
				color="red"
			/>

			<CardKPI
				title="Total Accounts"
				value={statistics?.total_accounts ?? 0}
				icon={<TeamOutlined />}
				color="green"
			/>

			<CardKPI
				title="Total Successful Accounts"
				value={statistics?.total_success_accounts ?? 0}
				icon={<CheckCircleOutlined />}
				color="green"
			/>

			<CardKPI
				title="Total Failed Accounts"
				value={statistics?.total_failed_accounts ?? 0}
				icon={<UserDeleteOutlined />}
				color="red"
			/>
			{statisticsLoading && <SpinComponent />}
		</div>
	);
};

export default React.memo(StatisticSummary);