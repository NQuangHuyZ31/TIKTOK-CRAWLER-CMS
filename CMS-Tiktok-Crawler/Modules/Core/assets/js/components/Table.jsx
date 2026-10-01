import React from 'react';
import { Table } from 'antd';

export default function TableComponent({ columns, data, pagination }) {
	return (
		<Table
			columns={columns}
			dataSource={data}
			pagination={pagination.per_page ?? 5}
		/>
	);
}
