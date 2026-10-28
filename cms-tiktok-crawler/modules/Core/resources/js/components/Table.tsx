import React, { useMemo } from 'react';
import { Button, Popconfirm, Space, Table, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import PermissionGate from './PermissionGate';

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

export interface TableComponentProps<T = any> extends Omit<TableProps<T>, 'dataSource' | 'columns'> {
	columns: TableColumn<T>[];
	data: T[];
	pagination?: PaginationInfo | false | null;
	handlePageChange?: (page: number, pageSize: number) => void;
	onPageChange?: (page: number, pageSize: number) => void;
	loading?: boolean;
	rowKey?: string | ((record: T) => string);

	// Custom column renderers by key or dataIndex
	renderColumns?: Record<string, (value: any, record: T, index: number) => React.ReactNode>;

	// Additional columns prepended or appended flexibly
	prependColumns?: TableColumn<T>[];
	extraColumns?: TableColumn<T>[];
	appendColumns?: TableColumn<T>[];

	// Native action props (Single Standard across all modules)
	onEdit?: (record: T) => void;
	onDelete?: (record: T) => void;
	canEdit?: boolean | ((record: T) => boolean);
	canDelete?: boolean | ((record: T) => boolean);
	deleteConfirmTitle?: string | ((record: T) => React.ReactNode);
	extraActions?: (record: T) => React.ReactNode;
	permissionModule?: string;
}

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
		const key = String(col.key ?? col.dataIndex ?? '');
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

/**
 * Streamlined TableComponent with concise base actions (Edit, Delete) and extra action slot.
 */
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
			render: (_: any, record: T) => {
				const isEditable = typeof canEdit === 'function' ? canEdit(record) : canEdit;
				const isDeletable = typeof canDelete === 'function' ? canDelete(record) : canDelete;
				const confirmDescription = typeof deleteConfirmTitle === 'function' ? deleteConfirmTitle(record) : deleteConfirmTitle;

				return (
					<Space size={4}>
						{extraActions && extraActions(record)}

						{onEdit && isEditable && (
							permissionModule ? (
								<PermissionGate module={permissionModule} action="edit">
									<Tooltip title="Edit">
										<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} onClick={() => onEdit(record)} />
									</Tooltip>
								</PermissionGate>
							) : (
								<Tooltip title="Edit">
									<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} onClick={() => onEdit(record)} />
								</Tooltip>
							)
						)}

						{onDelete && isDeletable && (
							permissionModule ? (
								<PermissionGate module={permissionModule} action="delete">
									<Popconfirm
										title="Delete"
										description={confirmDescription}
										onConfirm={() => onDelete(record)}
										okText="Delete"
										cancelText="Cancel"
										okButtonProps={{ danger: true }}
									>
										<Tooltip title="Delete">
											<Button type="text" danger size="small" icon={<DeleteOutlined />} />
										</Tooltip>
									</Popconfirm>
								</PermissionGate>
							) : (
								<Popconfirm
									title="Delete"
									description={confirmDescription}
									onConfirm={() => onDelete(record)}
									okText="Delete"
									cancelText="Cancel"
									okButtonProps={{ danger: true }}
								>
									<Tooltip title="Delete">
										<Button type="text" danger size="small" icon={<DeleteOutlined />} />
									</Tooltip>
								</Popconfirm>
							)
						)}
					</Space>
				);
			},
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
