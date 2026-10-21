import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatisticSummary from '../components/StatisticSummary';
import CrawlJobListTable from '../components/CrawlJobListTable';

const { Title } = Typography;

export default function CrawlJobsPage() {
	const navigate = useNavigate();

	return (
		<div>
			{/* Statistic Summary */}
			<StatisticSummary />

			{/* Crawl Jobs Table */}

			<Card
				style={{ marginTop: 20 }}
				extra={
					<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/crawler/crawl-job/create')}>
						Tạo job
					</Button>
				}
			>
				<CrawlJobListTable />
			</Card>
		</div>
	);
}
