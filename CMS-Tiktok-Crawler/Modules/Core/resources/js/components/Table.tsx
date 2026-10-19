import React from 'react';
import { Table, TableProps } from 'antd';

export interface PaginationInfo {
    page?: number;
    current_page?: number;
    per_page?: number;
    total?: number;
}

export interface TableComponentProps<T = any> extends Omit<TableProps<T>, 'dataSource'> {
    columns: any[];
    data: T[];
    pagination?: PaginationInfo;
    handlePageChange?: (page: number, pageSize: number) => void;
    loading?: boolean;
    rowKey?: string | ((record: T) => string);
}

export default function TableComponent<T = any>({
    columns,
    data,
    pagination,
    handlePageChange,
    loading = false,
    rowKey = 'id',
    ...restProps
}: TableComponentProps<T>) {
    const currentPage = pagination?.current_page ?? pagination?.page ?? 1;
    const pageSize = pagination?.per_page ?? 10;
    const total = pagination?.total ?? 0;

    return (
        <Table<T>
            columns={columns}
            dataSource={data}
            rowKey={rowKey}
            loading={loading}
            pagination={
                pagination === undefined || pagination === null
                    ? false
                    : {
                          current: currentPage,
                          pageSize: pageSize,
                          total: total,
                          showSizeChanger: true,
                          pageSizeOptions: [5, 10, 20, 50, 100],
                          showTotal: (t) => `Tổng ${t} mục`,
                          onChange: (page, size) => handlePageChange?.(page, size),
                      }
            }
            bordered={false}
            scroll={{ x: 'max-content' }}
            {...restProps}
        />
    );
}
