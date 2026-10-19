const crawlJobColumnConfig = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
		search_type: 'sort',
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		component: 'status',
	},
	{
		title: 'Total account',
		dataIndex: 'total_account',
		key: 'total_account',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Success',
		dataIndex: 'success_count',
		key: 'success_count',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Failed',
		dataIndex: 'failed_count',
		key: 'failed_count',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Started',
		dataIndex: 'started_at',
		key: 'started_at',
		defaultValue: '-',
		search_type: 'search',
		search_rule: {
			type: 'date',
			compare_with: 'finished_at',
			operator: '<=',
			message: 'Started date must be less than or equal to Finished date',
		}
	},
	{
		title: 'Finished',
		dataIndex: 'finished_at',
		key: 'finished_at',
		defaultValue: '-',
		search_type: 'search',
		search_rule: {
			type: 'date',
			compare_with: 'started_at',
			operator: '>=',
			message: 'Finished date must be greater than or equal to Started date',
		}
	},
	{
		title: 'Error message',
		dataIndex: 'error_message',
		key: 'error_message',
		defaultValue: '-',
		width: 80
	},
	{
		title: 'Action',
		key: 'action',
		component: 'action',
	},
];

const crawlResultColumnConfig = [
	{
		title: 'Username',
		dataIndex: 'username',
		key: 'username',
		search_type: 'search',
		search_rule: {
			type: 'text',
		}
	},
	{
		title: 'Status',
		dataIndex: 'status',
		key: 'status',
		component: 'status',
	},
	{
		title: 'Followers',
		dataIndex: 'followers_count',
		key: 'followers_count',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Following',
		dataIndex: 'following_count',
		key: 'following_count',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Likes',
		dataIndex: 'likes_count',
		key: 'likes_count',
		defaultValue: 0,
		search_type: 'sort'
	},
	{
		title: 'Error message',
		dataIndex: 'error_message',
		key: 'error_message',
		defaultValue: '-',
		width: 150
	},
	{
		title: 'Crawled At',
		dataIndex: 'crawled_at',
		key: 'crawled_at',
		defaultValue: '-',
	},
	{
		title: 'Profile URL',
		dataIndex: 'profile_url',
		key: 'profile_url',
		component: 'action',
		width: 200
	}
];

export { crawlJobColumnConfig, crawlResultColumnConfig };