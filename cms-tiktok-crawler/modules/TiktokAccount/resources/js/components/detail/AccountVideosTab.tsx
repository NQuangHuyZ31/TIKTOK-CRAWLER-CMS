import React from 'react';
import TiktokVideoTable, { VideoFilterValues } from '@core/components/TiktokVideoTable';

interface AccountVideosTabProps {
	data: any[];
	loading: boolean;
	pagination: { page: number; per_page: number; total: number };
	filters: VideoFilterValues;
	onFilterChange: (key: string, value: any) => void;
	onResetFilters: () => void;
	onPageChange: (page: number, per_page: number) => void;
	onRefresh: () => void;
}

export default function AccountVideosTab({
	data,
	loading,
	pagination,
	filters,
	onFilterChange,
	onResetFilters,
	onPageChange,
	onRefresh,
}: AccountVideosTabProps) {
	return (
		<TiktokVideoTable
			data={data}
			loading={loading}
			pagination={pagination}
			filters={filters}
			onFilterChange={onFilterChange}
			onResetFilters={onResetFilters}
			onPageChange={onPageChange}
			onRefresh={onRefresh}
			showAccount={false}
			showMusic={true}
			showDeltas={false}
			searchPlaceholder="Search by video caption, ID..."
		/>
	);
}
