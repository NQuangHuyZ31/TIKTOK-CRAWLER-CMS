import React from 'react';
import { Link } from 'react-router-dom';
import TableComponent from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { crawlResultColumnConfig } from '../configs/tableConfig';

interface CrawlResultTableProps {
	data: any[];
	loading?: boolean;
	pagination?: any;
	onPageChange?: (page: number, per_page: number) => void;
	setParams?: any;
	params?: any;
	dispatch?: any;
	error?: string | null;
	[key: string]: any;
}

const CrawlResultTable: React.FC<CrawlResultTableProps> = ({
	data,
	loading,
	pagination,
	onPageChange,
	setParams,
	error,
}) => {
	if (error) {
		return <div className="text-red-500 py-2">Error: {error}</div>;
	}

	const handlePage = (page: number, per_page: number) => {
		if (onPageChange) {
			onPageChange(page, per_page);
		} else if (setParams) {
			setParams({ page, per_page });
		}
	};

	return (
		<TableComponent
			columns={crawlResultColumnConfig}
			data={data}
			pagination={pagination}
			handlePageChange={handlePage}
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
