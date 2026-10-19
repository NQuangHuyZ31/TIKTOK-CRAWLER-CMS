import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '@core/store';
import { Alert, Button, Card, Descriptions, Space, Typography, App as AntdApp } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCrawlJobById, startCrawlJobById, getCrawlJobResults } from '../store/crawlJob/crawlJobThunks';
import { setParams } from '../store/crawlJob/crawlJobSlice';
import StatusTag from '@core/components/StatusTag';
import SpinComponent from '@core/components/SpinComponent';
import CrawlResultTable from '../components/CrawlResultTable';
import DeleteCrawljobButton from '../components/DeleteCrawlJobButton';

const { Title } = Typography;

export default function CrawlJobDetailPage() {
	const dispatch = useDispatch();
	const { message } = AntdApp.useApp();
	// Get crawl job details from Redux store
	const { currentJob: job, loading, error } = useSelector((state) => state.crawlJob);
	// Get crawl results from Redux store
	const { results, crawlResultsLoading: loadingResults, crawlResultsError: errorResults, pagination, params } = useSelector((state) => state.crawlJob);

	// Start loading state for crawl job
	const { startLoaing } = useSelector((state) => state.crawlJob);
	const { id } = useParams();
	const navigate = useNavigate();

	// Fetch crawl job details when the component mounts or when the job ID changes
	useEffect(() => {
		dispatch(fetchCrawlJobById(id));
	}, [id, dispatch]);

	// Fetch crawl results when the component mounts or when the job ID or params change
	useEffect(() => {
		dispatch(getCrawlJobResults({ id, params }));
	}, [dispatch, id, params]);

	// Handle starting the crawl job
	const handleStartCrawlJob = async () => {
		try {
			const result = await dispatch(startCrawlJobById(id)).unwrap();
			message.success(result?.message || 'Start completed');
		} catch (startError) {
			message.error(startError?.message || startError || 'Start failed');
		}
	}

	if (error) {
		return <Alert type="error" title={error} showIcon />;
	}

	return (
		<div>
			<Space align="center" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
				<Title level={4} style={{ margin: 0 }}>Chi tiết Crawl Job #{job?.id ?? id}</Title>
				<Space align="center" style={{ gap: 8 }}>
					{job?.status === 'pending' ? (
						<>
							<Button onClick={() => navigate(`/crawler/crawl-job/${id}/edit`)}>Edit</Button>
							<Button type="primary" icon={<PlayCircleOutlined />} loading={startLoaing} onClick={handleStartCrawlJob}>Start</Button>
						</>
					) : <Button color='default' disabled>
						{job?.status}
					</Button>}
					<DeleteCrawljobButton jobID={id} />
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
					<Descriptions.Item label="Duration" className="text-nowrap">{job?.duration ? `${job?.duration} seconds` : '-'}</Descriptions.Item>
					<Descriptions.Item label="Error">{job?.error_message || '-'}</Descriptions.Item>
				</Descriptions>
			</Card>

			<Card>
				<CrawlResultTable data={results} loading={loadingResults} setParams={setParams} error={errorResults} pagination={pagination} params={params} dispatch={dispatch} />
			</Card>
			{loading && <SpinComponent />}
		</div>
	);
}
