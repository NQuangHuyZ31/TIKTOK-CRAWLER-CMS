import type { TableColumn } from '@core/components/Table';

export const crawlJobColumnConfig: TableColumn[] = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
		sorter: (a: any, b: any) => (a.id ?? 0) - (b.id ?? 0),
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 120,
	},
	{
		title: 'Crawl Mode',
		dataIndex: 'crawl_mode',
		key: 'crawl_mode',
		width: 150,
	},
	{
		title: 'Total Accounts',
		dataIndex: 'total_account',
		key: 'total_account',
		sorter: (a: any, b: any) => (a.total_account ?? 0) - (b.total_account ?? 0),
	},
	{
		title: 'Success',
		dataIndex: 'success_count',
		key: 'success_count',
		sorter: (a: any, b: any) => (a.success_count ?? 0) - (b.success_count ?? 0),
	},
	{
		title: 'Failed',
		dataIndex: 'failed_count',
		key: 'failed_count',
		sorter: (a: any, b: any) => (a.failed_count ?? 0) - (b.failed_count ?? 0),
	},
	{
		title: 'Videos',
		dataIndex: 'total_videos_crawled',
		key: 'total_videos_crawled',
		sorter: (a: any, b: any) => (a.total_videos_crawled ?? 0) - (b.total_videos_crawled ?? 0),
	},
	{
		title: 'Started',
		dataIndex: 'started_at',
		key: 'started_at',
	},
	{
		title: 'Finished',
		dataIndex: 'finished_at',
		key: 'finished_at',
	},
	{
		title: 'Error Message',
		dataIndex: 'error_message',
		key: 'error_message',
		width: 150,
	},
	{
		key: 'action',
		title: '',
		width: 140,
		fixed: 'right',
	},
];

export const crawlResultColumnConfig: TableColumn[] = [
	{
		title: 'Avatar',
		dataIndex: 'avatar_path',
		key: 'avatar_path',
		width: 85,
	},
	{
		title: 'Username',
		dataIndex: 'username',
		key: 'username',
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
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
		width: 130,
		sorter: (a: any, b: any) => (a.videos_crawled_count ?? 0) - (b.videos_crawled_count ?? 0),
	},
	{
		title: 'Error Message',
		dataIndex: 'error_message',
		key: 'error_message',
		width: 150,
	},
	{
		title: 'Crawled At',
		dataIndex: 'crawled_at',
		key: 'crawled_at',
	},
	{
		title: 'Profile URL',
		dataIndex: 'profile_url',
		key: 'profile_url',
		width: 200,
	},
];

export const crawlVideoResultColumnConfig: TableColumn[] = [
	{
		title: 'Cover',
		dataIndex: 'cover_url',
		key: 'cover_url',
		width: 80,
	},
	{
		title: 'Video ID',
		dataIndex: 'video_id',
		key: 'video_id',
		width: 165,
	},
	{
		title: 'Username',
		dataIndex: 'username',
		key: 'username',
		width: 140,
	},
	{
		title: 'Description',
		dataIndex: 'description',
		key: 'description',
		width: 240,
	},
	{
		title: 'Views',
		dataIndex: 'play_count',
		key: 'play_count',
		sorter: (a: any, b: any) => (a.play_count ?? 0) - (b.play_count ?? 0),
	},
	{
		title: 'Likes',
		dataIndex: 'digg_count',
		key: 'digg_count',
		sorter: (a: any, b: any) => (a.digg_count ?? 0) - (b.digg_count ?? 0),
	},
	{
		title: 'Comments',
		dataIndex: 'comment_count',
		key: 'comment_count',
		sorter: (a: any, b: any) => (a.comment_count ?? 0) - (b.comment_count ?? 0),
	},
	{
		title: 'Shares',
		dataIndex: 'share_count',
		key: 'share_count',
		sorter: (a: any, b: any) => (a.share_count ?? 0) - (b.share_count ?? 0),
	},
	{
		title: 'Saves',
		dataIndex: 'collect_count',
		key: 'collect_count',
		sorter: (a: any, b: any) => (a.collect_count ?? 0) - (b.collect_count ?? 0),
	},
	{
		title: 'Published At',
		dataIndex: 'published_at',
		key: 'published_at',
		width: 160,
	},
	{
		title: 'Video URL',
		dataIndex: 'video_url',
		key: 'video_url',
		width: 180,
	},
];