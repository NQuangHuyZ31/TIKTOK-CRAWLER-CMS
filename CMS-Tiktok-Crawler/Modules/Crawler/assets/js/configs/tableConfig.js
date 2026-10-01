const crawlJobColumnConfig = [
	{
		title: 'ID',
		dataIndex: 'id',
		key: 'id',
		width: 80,
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
	},
	{
		title: 'Success',
		dataIndex: 'success_count',
		key: 'success_count',
		defaultValue: 0,
	},
	{
		title: 'Failed',
		dataIndex: 'failed_count',
		key: 'failed_count',
		defaultValue: 0,
	},
	{
		title: 'Started',
		dataIndex: 'started_at',
		key: 'started_at',
		defaultValue: '-',
	},
	{
		title: 'Finished',
		dataIndex: 'finished_at',
		key: 'finished_at',
		defaultValue: '-',
	},
	{
		title: 'Action',
		key: 'action',
		component: 'action',
	},
];

export { crawlJobColumnConfig };