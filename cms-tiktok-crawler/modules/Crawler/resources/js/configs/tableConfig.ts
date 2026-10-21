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
	},
	{
		title: 'Total account',
		dataIndex: 'total_account',
		key: 'total_account',
		sorter: (a: any, b: any) => (a.total_account ?? 0) - (b.total_account ?? 0),
	},
	{
		title: 'Success',
		dataIndex: 'success_count',
		key: 'success_count',
	},
	{
		title: 'Failed',
		dataIndex: 'failed_count',
		key: 'failed_count',
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
		title: 'Error message',
		dataIndex: 'error_message',
		key: 'error_message',
		width: 150,
	},
	{
		title: 'Action',
		key: 'action',
	},
];

export const crawlResultColumnConfig: TableColumn[] = [
	{
		title: 'Username',
		dataIndex: 'username',
		key: 'username',
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
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
		title: 'Error message',
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