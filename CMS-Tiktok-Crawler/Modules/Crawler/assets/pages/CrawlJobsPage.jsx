import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import api from '../../../../resources/js/lib/api';
import StatusTag from '../../../../resources/js/components/StatusTag';

const { Title } = Typography;

const columns = [
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
		render: (status) => <StatusTag status={status} />,
	},
	{
		title: 'Total account',
		dataIndex: 'total_account',
		key: 'total_account',
		render: (value) => value ?? 0,
	},
	{
		title: 'Success',
		dataIndex: 'success_count',
		key: 'success_count',
		render: (value) => value ?? 0,
	},
	{
		title: 'Failed',
		dataIndex: 'failed_count',
		key: 'failed_count',
		render: (value) => value ?? 0,
	},
	{
		title: 'Started',
		dataIndex: 'started_at',
		key: 'started_at',
		render: (value) => value || '-',
	},
	{
		title: 'Finished',
		dataIndex: 'finished_at',
		key: 'finished_at',
		render: (value) => value || '-',
	},
	{
		title: 'Action',
		key: 'action',
		render: (_, record) => (
			<Space>
				<Link to={`/crawl-jobs/${record.id}`}>Chi tiết</Link>
			</Space>
		),
	},
];

export default function CrawlJobsPage() {
	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				const response = await api.getCrawlJobs();
				const rows = Array.isArray(response?.data) ? response.data : [];

				if (active) {
					setJobs(rows);
				}
			} catch (err) {
				if (active) {
					setError(err.message || 'Không thể tải danh sách job');
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		load();

		return () => {
			active = false;
		};
	}, []);

	return (
		<div>
			<Title level={2}>Crawl Jobs</Title>

			<Card
				style={{ marginTop: 20 }}
				extra={
					<Button type="primary">Tạo job</Button>
				}
			>
				{error ? (
					<Alert type="error" title={error} showIcon />
				) : (
					<Table
						rowKey="id"
						columns={columns}
						dataSource={jobs}
						loading={loading}
						pagination={{ pageSize: 5 }}
					/>
				)}
			</Card>
		</div>
	);
}
