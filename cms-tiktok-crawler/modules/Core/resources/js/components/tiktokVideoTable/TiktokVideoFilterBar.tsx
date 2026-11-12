import React from 'react';
import { Button, DatePicker, Flex, Input, Space, theme } from 'antd';
import { ClearOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import NumericRangeFilter from '../NumericRangeFilter';
import { VIDEO_LIKE_PRESETS, VIDEO_VIEW_PRESETS } from '../../configs/videoTableConfig';
import type { VideoFilterValues } from '../TiktokVideoTable';

export interface TiktokVideoFilterBarProps {
	filters: VideoFilterValues;
	onFilterChange?: (key: keyof VideoFilterValues, value: any) => void;
	onResetFilters?: () => void;
	onRefresh?: () => void;
	loading?: boolean;
	searchPlaceholder?: string;
}

export default function TiktokVideoFilterBar({
	filters,
	onFilterChange,
	onResetFilters,
	onRefresh,
	loading = false,
	searchPlaceholder = 'Search by caption, ID...',
}: TiktokVideoFilterBarProps) {
	const { token } = theme.useToken();

	return (
		<Flex
			justify="space-between"
			align="center"
			wrap="wrap"
			gap={10}
			style={{
				padding: '12px 16px',
				background: token.colorFillAlter,
				borderBottom: `1px solid ${token.colorBorderSecondary}`,
			}}
		>
			<Flex align="center" wrap="wrap" gap={8} style={{ flex: 1 }}>
				<Input
					placeholder={searchPlaceholder}
					prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
					allowClear
					value={filters.search}
					onChange={(e) => onFilterChange?.('search', e.target.value)}
					style={{ width: 230 }}
				/>
				<NumericRangeFilter
					placeholder="Views"
					presets={VIDEO_VIEW_PRESETS}
					value={filters.play_count}
					onChange={(val) => onFilterChange?.('play_count', val)}
					width={130}
				/>
				<NumericRangeFilter
					placeholder="Likes"
					presets={VIDEO_LIKE_PRESETS}
					value={filters.digg_count}
					onChange={(val) => onFilterChange?.('digg_count', val)}
					width={130}
				/>
				<DatePicker
					placeholder="Published date"
					value={filters.published_at ? dayjs(filters.published_at) : undefined}
					onChange={(_, dateString) => onFilterChange?.('published_at', dateString || undefined)}
					allowClear
					style={{ width: 140 }}
				/>
				{onResetFilters && (
					<Button icon={<ClearOutlined />} onClick={onResetFilters}>
						Reset
					</Button>
				)}
			</Flex>

			{onRefresh && (
				<Space>
					<Button icon={<ReloadOutlined spin={loading} />} onClick={onRefresh} loading={loading}>
						Refresh
					</Button>
				</Space>
			)}
		</Flex>
	);
}
