import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import TableComponent from '@modules/Core/assets/js/components/Table';
import { crawlResultColumnConfig } from '@modules/Crawler/assets/js/configs/tableConfig';
import StatusTag from '@modules/Core/assets/js/components/StatusTag';
import crawlJobAPI from '@modules/Crawler/assets/js/services/api';

const CrawlResultTable = ({ id }) => {
	// config column
	const columns = crawlResultColumnConfig.map((column) => {
		if (column.component == 'status') {
			return {
				...column,
				render: (text) => <StatusTag status={text} />,
			};
		}

		if (column.search_type == 'sort') {
			return {
				...column,
				sorter: (a, b) =>
					(a[column.dataIndex] ?? 0) - (b[column.dataIndex] ?? 0),
			};
		}

		if (column.component == 'action' && column.dataIndex == 'profile_url') {
			return {
				...column,
				render: (text) => <Navigate to={text} target="_blank" />,
			};
		}
		return column;
	});

	// ============
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [pagination, setPagination] = useState({
		page: 1,
		per_page: 5,
		total: 0,
	});

	useEffect(() => {
		const fetchCrawlResults = async () => {
			setLoading(true);
			setError('');

			try {
				const res = await crawlJobAPI.getCrawlResultByCrawlJobID(id, {
					page: pagination.page,
					per_page: pagination.per_page,
				});

				setResults(res?.data ?? res ?? []);
				setPagination({
					page: res?.meta?.current_page ?? 1,
					per_page: res?.meta?.per_page ?? 10,
					total: res?.meta?.total ?? 0,
				});
			} catch (err) {
				setError(err.message || 'Không thể tải kết quả crawl');
			} finally {
				setLoading(false);
			}
		};

		fetchCrawlResults();
	}, [id, pagination.page, pagination.per_page]);

	const handlePageChange = (page, per_page) => {
		setPagination((prev) => ({
			...prev,
			page,
			per_page,
		}));
	};

	return (
		<>
			<TableComponent
				columns={columns}
				data={results}
				pagination={pagination}
				handlePageChange={handlePageChange}
				loading={loading}
			/>
		</>
	);
};

export default React.memo(CrawlResultTable);
