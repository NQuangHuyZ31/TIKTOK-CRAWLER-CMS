import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Space, Alert } from 'antd';
import crawlJobApi from '@modules/Crawler/assets/js/services/api';
import StatusTag from '@modules/Core/assets/js/components/StatusTag';
import TableComponent from '@modules/Core/assets/js/components/Table';
import { crawlJobColumnConfig } from '@modules/Crawler/assets/js/configs/tableConfig';
import SpinComponent from '@modules/Core/assets/js/components/Spin';

export default function CrawlJobListTable() {

	// Configure columns with custom renderers based on the column configuration
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

		if (column.serach_type === 'sort') {
			return {
				...column,
				sorter: (a, b) => (a[column.dataIndex] ?? 0) - (b[column.dataIndex] ?? 0),
			};
		}

		return column;
	});

	const [jobs, setJobs] = useState([]);
	const [pagination, setPagination] = useState({
		page: 1,
		per_page: 5,
		total: 0,
	});
	const [params, setParams] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Fetch crawl jobs from API
	useEffect(() => {
		const fetchJobs = async () => {
			try {
				setLoading(true);
				const response = await crawlJobApi.getCrawlJob({
					page: pagination.page,
					per_page: pagination.per_page
				});
				const rows = Array.isArray(response?.data) ? response.data : [];

				setJobs(rows);
				setPagination((prev) => ({
					...prev,
					total: response?.meta?.total ?? rows.length,
					per_page: response?.meta?.per_page ?? prev.per_page,
				}));
			} catch (err) {
				setError(err.message || 'Không thể tải danh sách job');
			} finally {
				setLoading(false);
			}
		}

		fetchJobs();
	}, [params, pagination.page, pagination.per_page]);

	// Handle page change for pagination
	const handlePageChange = (page, per_page) => {
		setPagination((prev) => ({
			...prev,
			page,
			per_page,
		}));
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
						loading={false}
					/>
				)
			}
			{loading && <SpinComponent />}
		</>
	)
}