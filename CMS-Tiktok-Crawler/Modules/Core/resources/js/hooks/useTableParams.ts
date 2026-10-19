import { useState, useCallback } from 'react';

export interface TableParams {
    page: number;
    per_page: number;
    sort_field?: string;
    sort_order?: 'ascend' | 'descend' | null;
    search?: string;
    [key: string]: any;
}

export function useTableParams(initialParams: Partial<TableParams> = {}) {
    const [params, setParams] = useState<TableParams>({
        page: 1,
        per_page: 10,
        ...initialParams,
    });

    const updateParams = useCallback((newParams: Partial<TableParams>) => {
        setParams((prev) => ({
            ...prev,
            ...newParams,
        }));
    }, []);

    const resetParams = useCallback(() => {
        setParams({
            page: 1,
            per_page: 10,
            ...initialParams,
        });
    }, [initialParams]);

    const handleTableChange = useCallback(
        (pagination: any, filters: any, sorter: any) => {
            const nextParams: Partial<TableParams> = {
                page: pagination.current ?? 1,
                per_page: pagination.pageSize ?? 10,
            };

            if (sorter && sorter.field) {
                nextParams.sort_field = sorter.field;
                nextParams.sort_order = sorter.order;
            }

            setParams((prev) => ({
                ...prev,
                ...nextParams,
                ...filters,
            }));
        },
        []
    );

    return {
        params,
        setParams,
        updateParams,
        resetParams,
        handleTableChange,
    };
}
