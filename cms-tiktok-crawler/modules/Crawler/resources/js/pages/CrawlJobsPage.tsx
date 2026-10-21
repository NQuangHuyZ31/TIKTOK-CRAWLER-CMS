import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@core/components/PageHeader';
import CrawlJobListTable from '../components/CrawlJobListTable';

export default function CrawlJobsPage() {
	const navigate = useNavigate();

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title="Crawl Jobs"
				subtitle="Quản lý và theo dõi các tác vụ cào dữ liệu TikTok."
				extra={
					<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/crawler/crawl-job/create')}>
						Tạo job
					</Button>
				}
			/>

			<Card title="Danh sách Crawl Jobs">
				<CrawlJobListTable />
			</Card>
		</div>
	);
}
