import React, { useMemo } from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd';
import { buildColumns, TableColumn, PaginationInfo } from './table/tableColumnBuilder';
import TableRowActions from './table/TableRowActions';

export type { TableColumn, PaginationInfo };
export { buildColumns };

export interface TableComponentProps<T = any> extends Omit<TableProps<T>, 'dataSource' | 'columns'> {
	columns: TableColumn<T>[];
	data: T[];
	pagination?: PaginationInfo | false | null;
	handlePageChange?: (page: number, pageSize: number) => void;
	onPageChange?: (page: number, pageSize: number) => void;
	loading?: boolean;
	rowKey?: string | ((record: T) => string);

	renderColumns?: Record<string, (value: any, record: T, index: number) => React.ReactNode>;
	prependColumns?: TableColumn<T>[];
	extraColumns?: TableColumn<T>[];
	appendColumns?: TableColumn<T>[];

	onEdit?: (record: T) => void;
	onDelete?: (record: T) => void;
	canEdit?: boolean | ((record: T) => boolean);
	canDelete?: boolean | ((record: T) => boolean);
	deleteConfirmTitle?: string | ((record: T) => React.ReactNode);
	extraActions?: (record: T) => React.ReactNode;
	permissionModule?: string;
}

export default function TableComponent<T = any>({
	columns,
	data,
	pagination,
	handlePageChange,
	onPageChange,
	loading = false,
	rowKey = 'id',
	renderColumns = {},
	prependColumns = [],
	extraColumns = [],
	appendColumns = [],
	onEdit,
	onDelete,
	canEdit = true,
	canDelete = true,
	deleteConfirmTitle = 'Are you sure you want to delete this record?',
	extraActions,
	permissionModule,
	...restProps
}: TableComponentProps<T>) {
	const finalExtra = extraColumns.length > 0 ? extraColumns : appendColumns;

	const actionsColumn = useMemo<TableColumn<T> | undefined>(() => {
		if (!onEdit && !onDelete && !extraActions) {
			return undefined;
		}

		return {
			title: 'Actions',
			key: 'actions',
			width: onEdit && onDelete ? 120 : 90,
			align: 'center',
			fixed: 'right',
			render: (_: any, record: T) => (
				<TableRowActions
					record={record}
					onEdit={onEdit}
					onDelete={onDelete}
					canEdit={canEdit}
					canDelete={canDelete}
					deleteConfirmTitle={deleteConfirmTitle}
					extraActions={extraActions}
					permissionModule={permissionModule}
				/>
			),
		};
	}, [onEdit, onDelete, canEdit, canDelete, deleteConfirmTitle, extraActions, permissionModule]);

	const tableColumns = useMemo(
		() => buildColumns<T>(columns, renderColumns, prependColumns, finalExtra, actionsColumn),
		[columns, renderColumns, prependColumns, finalExtra, actionsColumn],
	);

	const onPage = onPageChange ?? handlePageChange;
	const paginationConfig = useMemo(() => {
		if (pagination === false || pagination === null || pagination === undefined) {
			return false;
		}

		const currentPage = pagination.current_page ?? pagination.page ?? 1;
		const pageSize = pagination.per_page ?? pagination.limit ?? 10;
		const total = pagination.total ?? 0;

		return {
			current: currentPage,
			pageSize: pageSize,
			total: total,
			showSizeChanger: true,
			pageSizeOptions: [5, 10, 20, 50, 100],
			showTotal: (t: number, range: [number, number]) => `Total ${t} items (${range[0]}-${range[1]})`,
			onChange: (page: number, size: number) => onPage?.(page, size),
		};
	}, [pagination, onPage]);

	return <Table<T> columns={tableColumns} dataSource={data} rowKey={rowKey} loading={loading} pagination={paginationConfig} bordered={false} scroll={{ x: 'max-content' }} {...restProps} />;
}
