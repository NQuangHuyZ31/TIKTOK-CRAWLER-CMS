import { useEffect, useState } from 'react';
import { Alert, Card, Descriptions, Table, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import api from '../../../../resources/js/lib/api';
import StatusTag from '../../../../resources/js/components/StatusTag';

const { Title } = Typography;

export default function CrawlJobDetailPage() {
	const { id } = useParams();
	const [job, setJob] = useState(null);
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				const [jobRes, resultsRes] = await Promise.all([
					api.getCrawlJobById(id),
					api.getCrawlResultsByJobId(id),
				]);

				if (active) {
					setJob(jobRes?.data ?? jobRes ?? null);
					setResults(Array.isArray(resultsRes?.data) ? resultsRes.data : []);
				}
			} catch (err) {
				if (active) {
					setError(err.message || 'Không thể tải chi tiết job');
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
	}, [id]);

	if (loading) {
		return <Card loading />;
	}

	if (error) {
		return <Alert type="error" title={error} showIcon />;
	}

	const resultColumns = [
		{ title: 'Username', dataIndex: 'username', key: 'username' },
		{ title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <StatusTag status={status} /> },
		{ title: 'Followers', dataIndex: 'followers_count', key: 'followers_count' },
		{ title: 'Following', dataIndex: 'following_count', key: 'following_count' },
		{ title: 'Likes', dataIndex: 'likes_count', key: 'likes_count' },
		{ title: 'Profile URL', dataIndex: 'profile_url', key: 'profile_url', render: (value) => value ? <a href={value} target="_blank" rel="noreferrer">Open</a> : '-' },
	];

	return (
		<div>
			<Title level={2}>Chi tiết Crawl Job #{job?.id ?? id}</Title>

			<Card style={{ marginBottom: 20 }}>
				<Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
					<Descriptions.Item label="Status"><StatusTag status={job?.status} /></Descriptions.Item>
					<Descriptions.Item label="Total account">{job?.total_account ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Success">{job?.success_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Failed">{job?.failed_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Started at">{job?.started_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Finished at">{job?.finished_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Error">{job?.error_message || '-'}</Descriptions.Item>
				</Descriptions>
			</Card>

			<Card>
				<Table rowKey="id" columns={resultColumns} dataSource={results} pagination={{ pageSize: 5 }} />
			</Card>
		</div>
	);
}
