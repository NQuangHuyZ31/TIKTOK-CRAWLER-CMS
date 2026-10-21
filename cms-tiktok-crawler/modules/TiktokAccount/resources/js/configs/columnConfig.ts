import type { TableColumn } from '@core/components/Table';

export const tiktokAccountColumnConfig: TableColumn[] = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
		sorter: (a: any, b: any) => (a.id ?? 0) - (b.id ?? 0),
	},
	{
		title: 'Account',
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
		title: 'Crawled At',
		dataIndex: 'crawled_at',
		key: 'crawled_at',
	},
	{
		key: 'action',
		title: '',
		width: 120,
		fixed: 'right',
	},
];

export default tiktokAccountColumnConfig;