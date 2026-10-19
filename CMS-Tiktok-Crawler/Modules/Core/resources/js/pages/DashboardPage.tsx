import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Statistic, Typography } from 'antd';
import api from '@core/Action/api';

const { Title, Text } = Typography;

export default function DashboardPage() {
	const [summary, setSummary] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				const response = await api.get('/crawlers/crawl-jobs');
				const data = Array.isArray(response?.data) ? response.data : [];

				if (active) {
					setSummary({
						totalJobs: data.length,
						totalAccounts: data.reduce((sum, item) => sum + Number(item.total_account || 0), 0),
						completedJobs: data.filter((item) => String(item.status).toLowerCase() === 'completed').length,
						failedJobs: data.filter((item) => String(item.status).toLowerCase() === 'failed').length,
					});
				}
			} catch (err) {
				if (active) {
					setError(err.message || 'Không thể tải dữ liệu dashboard');
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

	if (loading) {
		return <Card loading />;
	}

	if (error) {
		return <Alert type="error" title={error} showIcon />;
	}

	return (
		<div>
			<Title level={2}>Dashboard</Title>
			<Text type="secondary">Tổng quan các phiên crawl TikTok</Text>

			<Row gutter={[16, 16]} style={{ marginTop: 20 }}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic title="Tổng job" value={summary?.totalJobs ?? 0} />
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic title="Tổng account" value={summary?.totalAccounts ?? 0} />
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic title="Job hoàn tất" value={summary?.completedJobs ?? 0} valueStyle={{ color: '#3f8600' }} />
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic title="Job lỗi" value={summary?.failedJobs ?? 0} valueStyle={{ color: '#cf1322' }} />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
