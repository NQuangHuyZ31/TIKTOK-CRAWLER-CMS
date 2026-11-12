import React from 'react';
import { Col, Row } from 'antd';
import { HeartOutlined, UserAddOutlined } from '@ant-design/icons';
import GrowthChart from '../../components/GrowthChart';
import type { DashboardGrowthTrends } from './types';

export interface DashboardGrowthChartsProps {
	growthTrends?: DashboardGrowthTrends | null;
	loading?: boolean;
	selectedPeriod?: number;
	onPeriodChange?: (days: number) => void;
}

/**
 * Modern dual-chart section displaying Followers Growth and Likes Growth
 * Designed specifically for the Core Dashboard.
 */
export default function DashboardGrowthCharts({ growthTrends, loading = false, selectedPeriod = 30, onPeriodChange }: DashboardGrowthChartsProps) {
	return (
		<Row gutter={[20, 20]}>
			{/* Followers Growth Chart */}
			<Col xs={24} lg={12}>
				<GrowthChart
					title="Followers Growth"
					subtitle="Daily follower trajectory and cumulative trend"
					data={growthTrends?.followers_growth}
					loading={loading}
					color="#EC008C"
					icon={<UserAddOutlined />}
					selectedPeriod={selectedPeriod}
					onPeriodChange={onPeriodChange}
				/>
			</Col>

			{/* Likes Growth Chart */}
			<Col xs={24} lg={12}>
				<GrowthChart
					title="Likes Growth"
					subtitle="Content engagement and accumulated likes trend"
					data={growthTrends?.likes_growth}
					loading={loading}
					color="#eb2f96"
					icon={<HeartOutlined />}
					selectedPeriod={selectedPeriod}
					onPeriodChange={onPeriodChange}
				/>
			</Col>
		</Row>
	);
}
