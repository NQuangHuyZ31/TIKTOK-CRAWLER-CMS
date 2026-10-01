import { useEffect, useState } from 'react';
import { Alert, Button, Card, Space, Table, Tag, Typography } from 'antd';
import {
	FileTextOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	TeamOutlined,
	UserDeleteOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import TableComponent from '@modules/Core/assets/js/components/Table';
import { crawlJobColumnConfig } from '@modules/Crawler/assets/js/configs/tableConfig';
import StatisticSummary from '@modules/Crawler/assets/js/components/StatisticSummary';
import StatusTag from '@modules/Core/assets/js/components/StatusTag';

const { Title } = Typography;

const columns = crawlJobColumnConfig.map((column) => {
	if (column.component === 'status') {
		return {
			...column,
			render: (status) => <StatusTag status={status} />
		};
	}

	if (column.component === 'action') {
		return {
			...column,
			render: (_, record) => (
				<Space>
					<Link to={`/crawl-jobs/${record.id}`}>Chi tiết</Link>
				</Space>
			)
		}
	}

	if (column.component === 'undefined') {
		return {
			...column,
			render: (value) => value ?? column.defaultValue ?? '-'
		};
	}

	return column;
});

export default function CrawlJobsPage() {
	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// useEffect(() => {
	// 	let active = true;

	// 	const load = async () => {
	// 		try {
	// 			const response = await api.getCrawlJobs();
	// 			const rows = Array.isArray(response?.data) ? response.data : [];

	// 			if (active) {
	// 				setJobs(rows);
	// 			}
	// 		} catch (err) {
	// 			if (active) {
	// 				setError(err.message || 'Không thể tải danh sách job');
	// 			}
	// 		} finally {
	// 			if (active) {
	// 				setLoading(false);
	// 			}
	// 		}
	// 	};

	// 	load();

	// 	return () => {
	// 		active = false;
	// 	};
	// }, []);
	const pagination = {
		per_page: 5,
	};

	return (
		<div>
			{/* Statistic Summary */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				<StatisticSummary
					title="Total Jobs"
					value={10}
					icon={<FileTextOutlined />}
					color="blue"
				/>

				<StatisticSummary
					title="Success Jobs"
					value={10}
					icon={<CheckCircleOutlined />}
					color="green"
				/>

				<StatisticSummary
					title="Failed Jobs"
					value={10}
					icon={<CloseCircleOutlined />}
					color="red"
				/>

				<StatisticSummary
					title="Total Success Accounts"
					value={10}
					icon={<TeamOutlined />}
					color="green"
				/>

				<StatisticSummary
					title="Total Failed Accounts"
					value={10}
					icon={<UserDeleteOutlined />}
					color="red"
				/>
			</div>

			<Card
				style={{ marginTop: 20 }}
				extra={
					<Button type="primary">Tạo job</Button>
				}
			>
				{error ? (
					<Alert type="error" title={error} showIcon />
				) : (
					<TableComponent
						columns={columns}
						data={jobs}
						pagination={pagination}
					/>
				)}
			</Card>
		</div>
	);
}
