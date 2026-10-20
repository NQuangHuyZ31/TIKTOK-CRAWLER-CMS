import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { Space, Alert } from 'antd';
import { fetchCrawlJobs } from '../store/crawlJob/crawlJobThunks';
import { setParams } from '../store/crawlJob/crawlJobSlice';
import TableComponent from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { crawlJobColumnConfig } from '../configs/tableConfig';
import DeleteCrawlJobButton from './DeleteCrawlJobButton';

export default function CrawlJobListTable() {
	const dispatch = useDispatch();
	const { data: jobs, loading, error, pagination, params } = useSelector((state) => state.crawlJob);

	// Fetch crawl jobs from API
	useEffect(() => {
		dispatch(fetchCrawlJobs(params));
	}, [dispatch, params]);

	// Handle page change for pagination
	const handlePageChange = (page: number, per_page: number) => {
		dispatch(setParams({ page, per_page }));
	};

	return (
		<>
			{error ? (
				<Alert type="error" title={error} showIcon />
			) : (
				<TableComponent
					columns={crawlJobColumnConfig}
					data={jobs}
					pagination={pagination}
					handlePageChange={handlePageChange}
					loading={loading}
					renderColumns={{
						status: (status) => <StatusTag status={status} />,
						action: (_, record) => (
							<Space>
								<Link to={`/crawler/crawl-job/${record.id}`}>Detail</Link>
								{record.status === 'pending' && (
									<Link to={`/crawler/crawl-job/${record.id}/edit`}>Edit</Link>
								)}
								<DeleteCrawlJobButton
									jobID={record.id}
									textOnly
									redirectOnDelete={false}
								/>
							</Space>
						),
					}}
				/>
			)}
		</>
	);
}