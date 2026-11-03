import type { TableColumn } from '@core/components/Table';
export { VIDEO_VIEW_PRESETS, VIDEO_LIKE_PRESETS } from '@core/configs/videoTableConfig';

export const accountCrawlHistoryColumnConfig: TableColumn[] = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 70,
	},
	{
		title: 'Status',
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
		title: 'Videos Crawled',
		dataIndex: 'videos_crawled_count',
		key: 'videos_crawled_count',
		width: 140,
	},
	{
		title: 'Crawled At',
		dataIndex: 'crawled_at',
		key: 'crawled_at',
		width: 170,
	},
	{
		title: 'Error Message',
		dataIndex: 'error_message',
		key: 'error_message',
	},
];
