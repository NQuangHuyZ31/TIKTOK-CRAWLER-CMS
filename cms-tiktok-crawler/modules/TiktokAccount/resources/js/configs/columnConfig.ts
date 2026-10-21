import type { TableColumn } from '@core/components/Table';

const tiktokAccountColumnConfig: TableColumn[] = [
	{
		key: 'username',
		title: 'Account',
		dataIndex: 'username',
	},
	{
		key: 'followers_count',
		title: 'Followers',
		dataIndex: 'followers_count',
		sorter: (a: any, b: any) => (a.followers_count ?? 0) - (b.followers_count ?? 0),
	},
	{
		key: 'following_count',
		title: 'Following',
		dataIndex: 'following_count',
		sorter: (a: any, b: any) => (a.following_count ?? 0) - (b.following_count ?? 0),
	},
	{
		key: 'likes_count',
		title: 'Likes',
		dataIndex: 'likes_count',
		sorter: (a: any, b: any) => (a.likes_count ?? 0) - (b.likes_count ?? 0),
	},
	{
		key: 'crawled_at',
		title: 'Crawled At',
		dataIndex: 'crawled_at',
	},
	{
		key: 'status',
		title: 'Status',
		dataIndex: 'status',
	},
	{
		key: 'action',
		title: 'Action',
	},
];

export default tiktokAccountColumnConfig;