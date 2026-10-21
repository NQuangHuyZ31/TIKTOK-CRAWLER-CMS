import React, { useMemo } from 'react';
import { Table, TableProps } from 'antd';
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

export interface TableComponentProps<T = any>
    extends Omit<TableProps<T>, 'dataSource' | 'columns'> {
    columns: TableColumn<T>[];
    data: T[];
    pagination?: PaginationInfo | false | null;
    handlePageChange?: (page: number, pageSize: number) => void;
    onPageChange?: (page: number, pageSize: number) => void;
    loading?: boolean;
    rowKey?: string | ((record: T) => string);

    // Tùy biến render cột theo key hoặc dataIndex khi sử dụng
    renderColumns?: Record<string, (value: any, record: T, index: number) => React.ReactNode>;

    // Thêm cột linh hoạt vào đầu hoặc cuối bảng
    prependColumns?: TableColumn<T>[];
    extraColumns?: TableColumn<T>[];
    appendColumns?: TableColumn<T>[];
}

/**
 * Xử lý danh sách cột: gộp cột (prepend/extra) và áp dụng render tùy biến hoặc fallback mặc định.
 */
export function buildColumns<T = any>(
    baseColumns: TableColumn<T>[],
    renderColumns: Record<string, (value: any, record: T, index: number) => React.ReactNode> = {},
    prependColumns: TableColumn<T>[] = [],
    extraColumns: TableColumn<T>[] = []
): ColumnsType<T> {
    const allColumns = [...prependColumns, ...baseColumns, ...extraColumns];

    return allColumns.map((col) => {
        const key = String(col.key ?? col.dataIndex ?? '');
        const dataIndex = typeof col.dataIndex === 'string' ? col.dataIndex : undefined;

        const colKey = col.key !== undefined && col.key !== null ? String(col.key) : undefined;
        const customRender =
            (colKey && renderColumns[colKey]) ||
            (dataIndex && renderColumns[dataIndex]);

        if (customRender) {
            return {
                ...col,
                render: (value: any, record: T, index: number) =>
                    customRender(value, record, index),
            };
        }

        // Ưu tiên 2: hàm render khai báo sẵn trong cột
        if (typeof col.render === 'function') {
            return col;
        }

        // Ưu tiên 3: render giá trị thông thường, fallback '-' khi rỗng
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
 * Component Table dùng chung thuần túy, chỉ chứa logic chung, không phụ thuộc component nghiệp vụ.
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
    ...restProps
}: TableComponentProps<T>) {
    const finalExtra = extraColumns.length > 0 ? extraColumns : appendColumns;

    const tableColumns = useMemo(
        () => buildColumns<T>(columns, renderColumns, prependColumns, finalExtra),
        [columns, renderColumns, prependColumns, finalExtra]
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
            showTotal: (t: number, range: [number, number]) =>
                `Tổng ${t} mục (${range[0]}-${range[1]})`,
            onChange: (page: number, size: number) => onPage?.(page, size),
        };
    }, [pagination, onPage]);

    return (
        <Table<T>
            columns={tableColumns}
            dataSource={data}
            rowKey={rowKey}
            loading={loading}
            pagination={paginationConfig}
            bordered={false}
            scroll={{ x: 'max-content' }}
            {...restProps}
        />
    );
}
