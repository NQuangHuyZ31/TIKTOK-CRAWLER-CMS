import { useEffect, useState, useCallback } from 'react';
import { Alert, Button, Card, Descriptions, Space, Typography, Popconfirm, App as AntdApp } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import crawlJobAPI from '../Action/crawlJob';
import StatusTag from '@core/components/StatusTag';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import CrawlResultTable from '../components/CrawlResultTable';

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

	// 1. Fetch Crawl Job details
	const loadJobDetail = useCallback(async () => {
		if (!id) return;
		try {
			const res: any = await crawlJobAPI.getCrawlJobByID(id);
			setJob(res?.data ?? res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load crawl job details');
		} finally {
			setLoading(false);
		}
	}, [id]);

	// 2. Fetch Crawl Results
	const loadResults = useCallback(
		async (page = 1, perPage = 10) => {
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
		},
		[id],
	);

	useEffect(() => {
		loadJobDetail();
		loadResults(1, 10);
	}, [loadJobDetail, loadResults]);

	// 3. Start Crawl Job directly via API
	const handleStartCrawlJob = async () => {
		if (!id) return;
		setStarting(true);
		try {
			const res: any = await crawlJobAPI.startCrawlJobByID(id);
			message.success(res?.message || 'Crawl job started successfully');
			loadJobDetail();
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to start crawl job');
		} finally {
			setStarting(false);
		}
	};

	// 4. Delete Crawl Job directly via API
	const handleDelete = async () => {
		if (!id) return;
		setDeleting(true);
		try {
			const res: any = await crawlJobAPI.deleteCrawlJobByID(id);
			message.success(res?.message || 'Crawl job deleted successfully');
			navigate('/crawler/crawl-job');
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to delete crawl job');
			setDeleting(false);
		}
	};

	if (loading) {
		return <SpinComponent />;
	}

	if (error) {
		return <Alert type="error" message={error} showIcon />;
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title={`Crawl Job Detail #${job?.id ?? id}`}
				subtitle="Track progress and results of the crawl session."
				onBack={() => navigate('/crawler/crawl-job')}
				extra={
					<Space align="center" style={{ gap: 8 }}>
						{job?.status === 'pending' ? (
							<>
								<Button icon={<EditOutlined />} onClick={() => navigate(`/crawler/crawl-job/${id}/edit`)}>
									Edit
								</Button>
								<Button type="primary" icon={<PlayCircleOutlined />} loading={starting} onClick={handleStartCrawlJob}>
									Start
								</Button>
							</>
						) : (
							<Button disabled>{job?.status}</Button>
						)}

						<Popconfirm
							title="Delete crawl job"
							description="Are you sure you want to delete this crawl job?"
							onConfirm={handleDelete}
							okText="Delete"
							cancelText="Cancel"
							okButtonProps={{ danger: true, loading: deleting }}
						>
							<Button danger icon={<DeleteOutlined />} loading={deleting}>
								Delete
							</Button>
						</Popconfirm>
					</Space>
				}
			/>

			<Card style={{ marginBottom: 20 }}>
				<Descriptions bordered column={{ xs: 1, sm: 2, lg: 4 }}>
					<Descriptions.Item label="Status">
						<StatusTag status={job?.status} />
					</Descriptions.Item>
					<Descriptions.Item label="Total Accounts">{job?.total_account ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Success">{job?.success_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Failed">{job?.failed_count ?? 0}</Descriptions.Item>
					<Descriptions.Item label="Started At">{job?.started_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Finished At">{job?.finished_at || '-'}</Descriptions.Item>
					<Descriptions.Item label="Duration">{job?.duration ? `${job?.duration}s` : '-'}</Descriptions.Item>
					<Descriptions.Item label="Error Message">{job?.error_message || '-'}</Descriptions.Item>
				</Descriptions>
			</Card>

			<Card title="Crawl Results">
				<CrawlResultTable data={results} loading={resultsLoading} pagination={pagination} setParams={(p: any) => loadResults(p.page, p.per_page)} />
			</Card>
		</div>
	);
}
