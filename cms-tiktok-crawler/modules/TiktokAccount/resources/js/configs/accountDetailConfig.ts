import type { TableColumn } from '@core/components/Table';
import type { NumericPreset } from '@core/components/NumericRangeFilter';

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

export const accountVideoColumnConfig: TableColumn[] = [
	{
		title: 'Video',
		dataIndex: 'cover_url',
		key: 'cover_url',
		width: 100,
	},
	{
		title: 'Mô tả & Hashtags',
		dataIndex: 'description',
		key: 'description',
		minWidth: 260,
	},
	{
		title: 'Thời lượng',
		dataIndex: 'duration',
		key: 'duration',
		width: 100,
		sorter: (a: any, b: any) => (a.duration ?? 0) - (b.duration ?? 0),
	},
	{
		title: 'Lượt xem (Views)',
		dataIndex: 'play_count',
		key: 'play_count',
		width: 140,
		sorter: (a: any, b: any) => (a.play_count ?? 0) - (b.play_count ?? 0),
	},
	{
		title: 'Thích (Likes)',
		dataIndex: 'digg_count',
		key: 'digg_count',
		width: 130,
		sorter: (a: any, b: any) => (a.digg_count ?? 0) - (b.digg_count ?? 0),
	},
	{
		title: 'Bình luận',
		dataIndex: 'comment_count',
		key: 'comment_count',
		width: 120,
		sorter: (a: any, b: any) => (a.comment_count ?? 0) - (b.comment_count ?? 0),
	},
	{
		title: 'Chia sẻ',
		dataIndex: 'share_count',
		key: 'share_count',
		width: 110,
		sorter: (a: any, b: any) => (a.share_count ?? 0) - (b.share_count ?? 0),
	},
	{
		title: 'Âm thanh',
		dataIndex: 'music_title',
		key: 'music_title',
		width: 180,
	},
	{
		title: 'Ngày đăng',
		dataIndex: 'published_at',
		key: 'published_at',
		width: 160,
		sorter: (a: any, b: any) => (new Date(a.published_at ?? 0).getTime()) - (new Date(b.published_at ?? 0).getTime()),
	},
	{
		title: 'Liên kết',
		dataIndex: 'video_url',
		key: 'video_url',
		width: 100,
		fixed: 'right',
	},
];

export const accountCrawlHistoryColumnConfig: TableColumn[] = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 70,
	},
	{
		title: 'Trạng thái',
		dataIndex: 'status',
		key: 'status',
		width: 120,
	},
	{
		title: 'Followers',
		dataIndex: 'followers_count',
		key: 'followers_count',
		sorter: (a: any, b: any) => (a.followers_count ?? 0) - (b.followers_count ?? 0),
	},
	{
		title: 'Following',
		dataIndex: 'following_count',
		key: 'following_count',
		sorter: (a: any, b: any) => (a.following_count ?? 0) - (b.following_count ?? 0),
	},
	{
		title: 'Likes',
		dataIndex: 'likes_count',
		key: 'likes_count',
		sorter: (a: any, b: any) => (a.likes_count ?? 0) - (b.likes_count ?? 0),
	},
	{
		title: 'Video cào được',
		dataIndex: 'videos_crawled_count',
		key: 'videos_crawled_count',
		width: 130,
	},
	{
		title: 'Thời gian cào',
		dataIndex: 'crawled_at',
		key: 'crawled_at',
		width: 170,
	},
	{
		title: 'Lỗi / Ghi chú',
		dataIndex: 'error_message',
		key: 'error_message',
	},
];
