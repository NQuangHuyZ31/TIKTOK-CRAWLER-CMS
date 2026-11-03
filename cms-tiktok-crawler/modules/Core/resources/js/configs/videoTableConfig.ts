import type { TableColumn } from '../components/Table';
import type { NumericPreset } from '../components/NumericRangeFilter';

export const VIDEO_VIEW_PRESETS: NumericPreset[] = [
	{ label: '< 10K', value: '<10000' },
	{ label: '10K - 50K', value: '10000..50000' },
	{ label: '50K - 100K', value: '50000..100000' },
	{ label: '100K - 500K', value: '100000..500000' },
	{ label: '500K - 1M', value: '500000..1000000' },
	{ label: '≥ 1M', value: '>=1000000' },
];

export const VIDEO_LIKE_PRESETS: NumericPreset[] = [
	{ label: '< 1K', value: '<1000' },
	{ label: '1K - 10K', value: '1000..10000' },
	{ label: '10K - 50K', value: '10000..50000' },
	{ label: '50K - 100K', value: '50000..100000' },
	{ label: '≥ 100K', value: '>=100000' },
];

export const formatDuration = (seconds?: number): string => {
	if (!seconds || seconds <= 0) return '-';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export interface VideoTableColumnOptions {
	showAccount?: boolean;
	showVideoId?: boolean;
	showMusic?: boolean;
}

export const createVideoTableColumns = (options: VideoTableColumnOptions = {}): TableColumn[] => {
	const columns: TableColumn[] = [
		{
			title: 'Video',
			dataIndex: 'cover_url',
			key: 'cover_url',
			width: 80,
		},
	];

	if (options.showVideoId) {
		columns.push({
			title: 'Video ID',
			dataIndex: 'video_id',
			key: 'video_id',
			width: 160,
		});
	}

	if (options.showAccount) {
		columns.push({
			title: 'Account',
			dataIndex: 'username',
			key: 'username',
			width: 130,
		});
	}

	columns.push(
		// {
		// 	title: 'Description & Hashtags',
		// 	dataIndex: 'description',
		// 	key: 'description',
		// 	minWidth: 240,
		// },
		{
			title: 'Duration',
			dataIndex: 'duration',
			key: 'duration',
			width: 95,
			sorter: (a: any, b: any) => (a.duration ?? 0) - (b.duration ?? 0),
		},
		{
			title: 'Views',
			dataIndex: 'play_count',
			key: 'play_count',
			width: 135,
			sorter: (a: any, b: any) => (a.play_count ?? 0) - (b.play_count ?? 0),
		},
		{
			title: 'Likes',
			dataIndex: 'digg_count',
			key: 'digg_count',
			width: 125,
			sorter: (a: any, b: any) => (a.digg_count ?? 0) - (b.digg_count ?? 0),
		},
		{
			title: 'Comments',
			dataIndex: 'comment_count',
			key: 'comment_count',
			width: 110,
			sorter: (a: any, b: any) => (a.comment_count ?? 0) - (b.comment_count ?? 0),
		},
		{
			title: 'Shares',
			dataIndex: 'share_count',
			key: 'share_count',
			width: 100,
			sorter: (a: any, b: any) => (a.share_count ?? 0) - (b.share_count ?? 0),
		},
		{
			title: 'Saves',
			dataIndex: 'collect_count',
			key: 'collect_count',
			width: 100,
			sorter: (a: any, b: any) => (a.collect_count ?? 0) - (b.collect_count ?? 0),
		},
	);

	if (options.showMusic) {
		columns.push({
			title: 'Sound / Music',
			dataIndex: 'music_title',
			key: 'music_title',
			width: 160,
		});
	}

	columns.push(
		{
			title: 'Published At',
			dataIndex: 'published_at',
			key: 'published_at',
			width: 160,
			sorter: (a: any, b: any) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime(),
		},
		{
			title: 'Link',
			dataIndex: 'video_url',
			key: 'video_url',
			width: 150,
			fixed: 'right',
		},
	);

	return columns;
};
