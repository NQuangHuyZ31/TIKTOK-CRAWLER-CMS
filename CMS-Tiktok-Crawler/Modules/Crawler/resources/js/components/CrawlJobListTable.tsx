import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { Space, Alert } from 'antd';
import { fetchCrawlJobs } from '../store/crawlJob/crawlJobThunks';
import { setParams } from '../store/crawlJob/crawlJobSlice';
import StatusTag from '@core/components/StatusTag';
import TableComponent from '@core/components/Table';
import { crawlJobColumnConfig } from '../configs/tableConfig';
import SearchColumnTable from '@core/components/SearchColumnTable';
import DeleteCrawlJobButton from './DeleteCrawlJobButton';

export default function CrawlJobListTable() {
	const dispatch = useDispatch();
	const { data: jobs, loading, error, pagination, params } = useSelector((state) => state.crawlJob);


	// Configure columns with custom renderers based on the column configuration
	const columns = useMemo(() => {
		return crawlJobColumnConfig.map((column) => {
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
							<Link to={`/crawler/crawl-job/${record.id}`}>Detail</Link>
							{record.status === 'pending' && <Link to={`/crawler/crawl-job/${record.id}/edit`}>Edit</Link>}
							<DeleteCrawlJobButton
								jobID={record.id}
								textOnly
								redirectOnDelete={false}
							/>
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

			if (column.search_type === 'sort') {
				return {
					...column,
					sorter: (a, b) => (a[column.dataIndex] ?? 0) - (b[column.dataIndex] ?? 0),
				};
			}

			if (column.search_type === 'search') {
				return SearchColumnTable(column, column.search_rule.type, setParams, dispatch, params);
			}

			return column;
		});
	}, [crawlJobColumnConfig, dispatch, params]);


	// Fetch crawl jobs from API
	useEffect(() => {
		dispatch(fetchCrawlJobs(params));
	}, [dispatch, params])

	// Handle page change for pagination
	const handlePageChange = (page, per_page) => {
		dispatch(setParams({ page, per_page }));
	}

	return (
		<>
			{
				error ? (
					<Alert type="error" title={error} showIcon />
				) : (
					<TableComponent
						columns={columns}
						data={jobs}
						pagination={pagination}
						handlePageChange={handlePageChange}
						loading={loading}
					/>
				)
			}
		</>
	)
}