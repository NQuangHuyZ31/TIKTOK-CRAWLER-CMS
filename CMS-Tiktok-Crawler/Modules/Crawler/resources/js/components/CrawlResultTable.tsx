import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TableComponent from '@core/components/Table';
import { crawlResultColumnConfig } from '../configs/tableConfig';
import StatusTag from '@core/components/StatusTag';
import SearchColumnTable from '@core/components/SearchColumnTable';

const CrawlResultTable = ({ data, setParams, params, loading, pagination, dispatch, error }) => {
	// config column
	const columns = useMemo(() => {
		return crawlResultColumnConfig.map((column) => {
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
					render: (text) => <Link to={text} target="_blank" rel="noopener noreferrer">
						{text}
					</Link>,
				};
			}

			if (column.search_type === 'search') {
				return SearchColumnTable(column, column.search_rule.type, setParams, dispatch, params);
			}

			return column;
		});
	}, [crawlResultColumnConfig, dispatch, params]);


	if (error) {
		return <div>Error: {error}</div>;
	}

	const handlePageChange = (page, per_page) => {
		dispatch(setParams({ page, per_page }));
	};

	return (
		<>
			<TableComponent
				columns={columns}
				data={data}
				pagination={pagination}
				handlePageChange={handlePageChange}
				loading={loading}
			/>
		</>
	);
};

export default React.memo(CrawlResultTable);
