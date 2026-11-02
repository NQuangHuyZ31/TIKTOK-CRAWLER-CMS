import React, { useMemo } from 'react';
import { Button, Card, DatePicker, Flex, Input, Select, Space } from 'antd';
import { ReloadOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TableComponent from '@core/components/Table';
import NumericRangeFilter from '@core/components/NumericRangeFilter';
import { formatNumber } from '@core/utils/formatNumber';
import { crawlResultColumnConfig } from '../../configs/tableConfig';
import {
	CRAWL_RESULT_STATUS_FILTER_OPTIONS,
	FOLLOWER_PRESETS,
	FOLLOWING_PRESETS,
	LIKE_PRESETS,
} from '../../configs/crawlerOptions';
import { createAccountColumnRenderers } from './JobResultRenderers';

interface AccountResultsTabProps {
	data: any[];
	loading: boolean;
	pagination: { page?: number; current_page?: number; per_page?: number; total?: number };
	params: {
		search?: string;
		status?: string;
		followers_count?: string;
		following_count?: string;
		likes_count?: string;
		crawled_at?: string;
		[key: string]: any;
	};
	onParamChange: (key: string, val: any) => void;
	onResetParams: () => void;
	onPageChange: (page: number, per_page: number) => void;
	onRefresh: () => void;
	onSelectUserVideos: (username: string) => void;
}

export default function AccountResultsTab({
	data,
	loading,
	pagination,
	params,
	onParamChange,
	onResetParams,
	onPageChange,
	onRefresh,
	onSelectUserVideos,
}: AccountResultsTabProps) {
	const renderColumns = useMemo(
		() => createAccountColumnRenderers(onSelectUserVideos),
		[onSelectUserVideos],
	);

	return (
		<Card
			title={
				<Space size={8}>
					<UserOutlined />
					<span>Account Crawl Results ({formatNumber(pagination.total || 0)})</span>
				</Space>
			}
		>
			<Flex wrap="wrap" gap={8} align="center" style={{ marginBottom: 16 }}>
				<Input
					placeholder="Search by username, URL..."
					prefix={<SearchOutlined />}
					allowClear
					value={params.search}
					onChange={(e) => onParamChange('search', e.target.value)}
					style={{ width: 220 }}
				/>
				<Select
					placeholder="All statuses"
					allowClear
					value={params.status}
					options={CRAWL_RESULT_STATUS_FILTER_OPTIONS}
					onChange={(val) => onParamChange('status', val)}
					style={{ width: 140 }}
				/>
				<NumericRangeFilter
					placeholder="Followers"
					value={params.followers_count}
					presets={FOLLOWER_PRESETS}
					onChange={(val) => onParamChange('followers_count', val)}
					width={130}
				/>
				<NumericRangeFilter
					placeholder="Following"
					value={params.following_count}
					presets={FOLLOWING_PRESETS}
					onChange={(val) => onParamChange('following_count', val)}
					width={130}
				/>
				<NumericRangeFilter
					placeholder="Likes"
					value={params.likes_count}
					presets={LIKE_PRESETS}
					onChange={(val) => onParamChange('likes_count', val)}
					width={130}
				/>
				<DatePicker
					placeholder="Crawled At"
					value={params.crawled_at ? dayjs(params.crawled_at) : undefined}
					onChange={(date) =>
						onParamChange(
							'crawled_at',
							date && date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : undefined,
						)
					}
					style={{ width: 150 }}
				/>
				<Button onClick={onResetParams}>Reset Filters</Button>
				<Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
					Refresh
				</Button>
			</Flex>

			<TableComponent
				columns={crawlResultColumnConfig}
				data={data}
				pagination={pagination}
				handlePageChange={onPageChange}
				loading={loading}
				renderColumns={renderColumns}
			/>
		</Card>
	);
}
