import { Table } from 'antd';

export default function TableComponent({ columns, data, pagination, handlePageChange, loading }) {
	return (
		<Table
			columns={columns}
			dataSource={data}
			rowKey="id"
			pagination={{
				current: pagination.current_page,
				pageSize: pagination.per_page,
				total: pagination.total,
				showSizeChanger: true,
				pageSizeOptions: [5, 10, 20, 50, 100],
				onChange: (page, pageSize) => handlePageChange(page, pageSize),
			}}
			loading={loading}
		/>
	);
}
