import React from 'react';
import type { ColumnsType, ColumnType } from 'antd/es/table';

export interface PaginationInfo {
	page?: number;
	current_page?: number;
	per_page?: number;
	limit?: number;
	total?: number;
}

export type TableColumn<T = any> = ColumnType<T> & {
	defaultValue?: React.ReactNode;
	[key: string]: any;
};

/**
 * Merges column configurations, prepended/extra columns, and applies custom renderers.
 */
export function buildColumns<T = any>(
	baseColumns: TableColumn<T>[],
	renderColumns: Record<string, (value: any, record: T, index: number) => React.ReactNode> = {},
	prependColumns: TableColumn<T>[] = [],
	extraColumns: TableColumn<T>[] = [],
	actionsColumn?: TableColumn<T>,
): ColumnsType<T> {
	const allColumns = [...prependColumns, ...baseColumns, ...extraColumns, ...(actionsColumn ? [actionsColumn] : [])];

	return allColumns.map((col) => {
		const dataIndex = typeof col.dataIndex === 'string' ? col.dataIndex : undefined;
		const colKey = col.key !== undefined && col.key !== null ? String(col.key) : undefined;
		const customRender = (colKey && renderColumns[colKey]) || (dataIndex && renderColumns[dataIndex]);

		if (customRender) {
			return {
				...col,
				render: (value: any, record: T, index: number) => customRender(value, record, index),
			};
		}

		if (typeof col.render === 'function') {
			return col;
		}

		return {
			...col,
			render: (value: any) => {
				if (value === null || value === undefined || value === '') {
					return col.defaultValue ?? '-';
				}
				return value;
			},
		};
	});
}
