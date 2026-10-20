import React from 'react';
import { Link } from 'react-router-dom';
import TableComponent from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { crawlResultColumnConfig } from '../configs/tableConfig';

interface CrawlResultTableProps {
	data: any[];
	setParams?: any;
	loading?: boolean;
	pagination?: any;
	dispatch?: any;
	error?: string | null;
}

const CrawlResultTable: React.FC<CrawlResultTableProps> = ({
	data,
	setParams,
	loading,
	pagination,
	dispatch,
	error,
}) => {
	if (error) {
		return <div className="text-red-500 py-2">Error: {error}</div>;
	}

	const handlePageChange = (page: number, per_page: number) => {
		if (dispatch && setParams) {
			dispatch(setParams({ page, per_page }));
		}
	};

	return (
		<TableComponent
			columns={crawlResultColumnConfig}
			data={data}
			pagination={pagination}
			handlePageChange={handlePageChange}
			loading={loading}
			renderColumns={{
				status: (status) => <StatusTag status={status} />,
				profile_url: (text: string) => (
					<Link to={text} target="_blank" rel="noopener noreferrer">
						{text}
					</Link>
				),
			}}
		/>
	);
};

export default React.memo(CrawlResultTable);
