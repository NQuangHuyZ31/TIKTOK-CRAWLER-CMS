import React, { useEffect } from "react";
import {
	CheckCircleOutlined,
	LikeOutlined,
	UserAddOutlined,
	UserDeleteOutlined,
	UserOutlined,
	UsergroupAddOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from '@core/store';
import { fetchStatisticSummary } from "../store/tiktokAccount/tiktokAccountThunks";
import formatCurrency from "@core/utils/formatCurrency";
import SpinComponent from "@core/components/SpinComponent";
import CardKPI from "@core/components/CardKPI";

const StatisticSummary = () => {
	const dispatch = useDispatch();

	const { statistics, statisticsLoading, statisticsError } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fetchStatisticSummary());
	}, [dispatch]);

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<CardKPI
				title="Total Accounts"
				value={formatCurrency(statistics?.total_accounts ?? 0)}
				icon={<UserOutlined />}
				color="blue"
			/>

			<CardKPI
				title="Total Active Accounts"
				value={formatCurrency(statistics?.total_active_accounts ?? 0)}
				icon={<CheckCircleOutlined />}
				color="green"
			/>

			<CardKPI
				title="Total Inactive Accounts"
				value={formatCurrency(statistics?.total_inactive_accounts ?? 0)}
				icon={<UserDeleteOutlined />}
				color="red"
			/>

			<CardKPI
				title="Total Followers"
				value={formatCurrency(statistics?.total_followers ?? 0)}
				icon={<UsergroupAddOutlined />}
				color="green"
			/>

			<CardKPI
				title="Total Following"
				value={formatCurrency(statistics?.total_following ?? 0)}
				icon={<UserAddOutlined />}
				color="green"
			/>

			<CardKPI
				title="Total Likes"
				value={formatCurrency(statistics?.total_likes ?? 0)}
				icon={<LikeOutlined />}
				color="blue"
			/>
			{statisticsLoading && <SpinComponent />}
		</div>
	)
}

export default React.memo(StatisticSummary);