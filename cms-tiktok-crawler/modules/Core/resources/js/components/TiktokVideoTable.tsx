import React, { useMemo } from 'react';
import { Card, theme } from 'antd';
import TableComponent, { PaginationInfo } from './Table';
import { createVideoTableColumns, VideoTableColumnOptions } from '../configs/videoTableConfig';
import TiktokVideoFilterBar from './tiktokVideoTable/TiktokVideoFilterBar';
import { buildVideoColumnRenderers, renderStatWithDelta } from './tiktokVideoTable/videoTableColumnRenderers';

export { renderStatWithDelta };

export interface VideoFilterValues {
	search?: string;
	play_count?: string;
	digg_count?: string;
	published_at?: string;
	[key: string]: any;
}

export interface TiktokVideoTableProps {
	data: any[];
	loading?: boolean;
	pagination: PaginationInfo;
	onPageChange: (page: number, perPage: number) => void;
	onRefresh?: () => void;
	filters?: VideoFilterValues;
	onFilterChange?: (key: keyof VideoFilterValues, value: any) => void;
	onResetFilters?: () => void;
	showFilters?: boolean;
	searchPlaceholder?: string;
	showAccount?: boolean;
	showVideoId?: boolean;
	showMusic?: boolean;
	showDeltas?: boolean;
	cardTitle?: React.ReactNode;
	extra?: React.ReactNode;
	bordered?: boolean;
	wrapInCard?: boolean;
}

export default function TiktokVideoTable({
	data,
	loading = false,
	pagination,
	onPageChange,
	onRefresh,
	filters = {},
	onFilterChange,
	onResetFilters,
	showFilters = true,
	searchPlaceholder = 'Search by caption, ID...',
	showAccount = false,
	showVideoId = false,
	showMusic = true,
	showDeltas = false,
	cardTitle,
	extra,
	bordered = false,
	wrapInCard = true,
}: TiktokVideoTableProps) {
	const { token } = theme.useToken();
	const columnOptions: VideoTableColumnOptions = useMemo(
		() => ({ showAccount, showVideoId, showMusic, showDeltas }),
		[showAccount, showVideoId, showMusic, showDeltas]
	);

	const columns = useMemo(() => createVideoTableColumns(columnOptions), [columnOptions]);
	const renderColumns = useMemo(
		() => buildVideoColumnRenderers({ showDeltas, showAccount, showMusic }),
		[showDeltas, showAccount, showMusic]
	);

	const content = (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			{showFilters && (
				<TiktokVideoFilterBar
					filters={filters}
					onFilterChange={onFilterChange}
					onResetFilters={onResetFilters}
					onRefresh={onRefresh}
					loading={loading}
					searchPlaceholder={searchPlaceholder}
				/>
			)}
			<TableComponent
				columns={columns}
				data={data}
				loading={loading}
				pagination={pagination}
				onPageChange={onPageChange}
				renderColumns={renderColumns}
				rowKey="id"
				bordered={bordered}
			/>
		</div>
	);

	if (!wrapInCard) return content;

	return (
		<Card
			title={cardTitle}
			extra={extra}
			styles={{ body: { padding: 0 } }}
			style={{
				borderRadius: 12,
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
			}}
		>
			{content}
		</Card>
	);
}
