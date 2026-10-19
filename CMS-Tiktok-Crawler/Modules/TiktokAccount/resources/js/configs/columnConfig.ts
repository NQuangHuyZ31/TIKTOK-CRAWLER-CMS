
const tiktokAccountColumnConfig = [
	{
		key: 'username',
		title: 'Account',
		dataIndex: 'username',
		component: 'account',
		search_type: 'search',
		search_rule: {
			type: 'text',
			message: 'Please input username',
		}
	},
	{
		key: 'followers_count',
		title: 'Followers',
		dataIndex: 'followers_count',
		sort: true,
		defaultValue: 0
	},
	{
		key: 'following_count',
		title: 'Following',
		dataIndex: 'following_count',
		sort: true,
		defaultValue: 0
	},
	{
		key: 'likes_count',
		title: 'Likes',
		dataIndex: 'likes_count',
		sort: true,
		defaultValue: 0
	},
	{
		key: 'crawled_at',
		title: 'Crawled At',
		dataIndex: 'crawled_at',
		sort: true,
		defaultValue: '-'
	},
	{
		key: 'status',
		title: 'Status',
		dataIndex: 'status',
		component: 'status',
		sort: true,
	},
	{
		key: 'action',
		title: 'Action',
		dataIndex: 'action',
		component: 'action'
	}
];

export default tiktokAccountColumnConfig;