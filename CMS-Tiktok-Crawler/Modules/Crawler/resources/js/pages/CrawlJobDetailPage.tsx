import { useEffect, useState, useCallback } from 'react';
import { Alert, Button, Card, Descriptions, Space, Typography, Popconfirm, App as AntdApp } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import crawlJobAPI from '../Action/crawlJob';
import StatusTag from '@core/components/StatusTag';
import SpinComponent from '@core/components/SpinComponent';
import CrawlResultTable from '../components/CrawlResultTable';

const { Title } = Typography;

export default function CrawlJobDetailPage() {
	const { message } = AntdApp.useApp();
	const { id } = useParams();
	const navigate = useNavigate();

	// Local states for Job Detail
	const [job, setJob] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Local states for Crawl Results
	const [results, setResults] = useState<any[]>([]);
	const [resultsLoading, setResultsLoading] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0 });

	// 1. Fetch chi tiết Crawl Job
	const loadJobDetail = useCallback(async () => {
		if (!id) return;
		try {
			const res: any = await crawlJobAPI.getCrawlJobByID(id);
			setJob(res?.data ?? res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Không thể tải thông tin crawl job');
		} finally {
			setLoading(false);
		}
	}, [id]);

	// 2. Fetch danh sách kết quả Crawl
	const loadResults = useCallback(async (page = 1, perPage = 10) => {
		if (!id) return;
		setResultsLoading(true);
		try {
			const res: any = await crawlJobAPI.getResults(id, { page, per_page: perPage });
			setResults(res?.data ?? []);
			setPagination({
				page: res?.meta?.current_page ?? page,
				per_page: res?.meta?.per_page ?? perPage,
				total: res?.meta?.total ?? 0,
			});
		} catch {
			// Error loading results silently handled
		} finally {
			setResultsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadJobDetail();
		loadResults(1, 10);
	}, [loadJobDetail, loadResults]);

	// 3. Khởi chạy Crawl Job trực tiếp qua API
	const handleStartCrawlJob = async () => {
		if (!id) return;
		setStarting(true);
		try {
			const res: any = await crawlJobAPI.startCrawlJobByID(id);
			message.success(res?.message || 'Khởi chạy crawl job thành công');
			loadJobDetail();
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Khởi chạy thất bại');
		} finally {
			setStarting(false);
		}
	};

	// 4. Xóa Crawl Job trực tiếp qua API (không cần component trung gian)
	const handleDelete = async () => {
		if (!id) return;
		setDeleting(true);
		try {
			const res: any = await crawlJobAPI.deleteCrawlJobByID(id);
			message.success(res?.message || 'Xóa crawl job thành công');
			navigate('/crawler/crawl-job');
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Xóa crawl job thất bại');
			setDeleting(false);
		}
	};

	if (loading) {
		return <SpinComponent />;
	}

	if (error) {
		return <Alert type="error" title={error} showIcon />;
	}

	return (
		<div>
			<Space align="center" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
				<Space align="center">
					<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/crawler/crawl-job')}>
						Quay lại
					</Button>
					<Title level={4} style={{ margin: 0 }}>Chi tiết Crawl Job #{job?.id ?? id}</Title>
				</Space>

				<Space align="center" style={{ gap: 8 }}>
					{job?.status === 'pending' ? (
						<>
							<Button icon={<EditOutlined />} onClick={() => navigate(`/crawler/crawl-job/${id}/edit`)}>
								Edit
							</Button>
							<Button
								type="primary"
								icon={<PlayCircleOutlined />}
								loading={starting}
								onClick={handleStartCrawlJob}
							>
								Start
							</Button>
						</>
					) : (
						<Button disabled>{job?.status}</Button>
					)}

					<Popconfirm
						title="Xóa crawl job"
						description="Bạn có chắc chắn muốn xóa crawl job này?"
						onConfirm={handleDelete}
						okText="Xóa"
						cancelText="Hủy"
						okButtonProps={{ danger: true, loading: deleting }}
					>
						<Button danger icon={<DeleteOutlined />} loading={deleting}>
							Delete
						</Button>
					</Popconfirm>
				</Space>
			</Space>

			<Card style={{ marginBottom: 20 }}>
				<Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
					<Descriptions.Item label="Status"><StatusTag status={job?.status} /></Descriptions.Item>
					<Descriptions.Item label="Total account">{job?.total_account ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Success">{job?.success_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Failed">{job?.failed_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Started at">{job?.started_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Finished at">{job?.finished_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Duration">{job?.duration ? `${job?.duration}s` : '-'}</Descriptions.Item>
					<Descriptions.Item label="Error">{job?.error_message || '-'}</Descriptions.Item>
				</Descriptions>
			</Card>

			<Card title="Danh sách kết quả crawl">
				<CrawlResultTable
					data={results}
					loading={resultsLoading}
					pagination={pagination}
					setParams={(p: any) => loadResults(p.page, p.per_page)}
				/>
			</Card>
		</div>
	);
}
