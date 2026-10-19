import { useState, useCallback } from 'react';

export interface PaginationState {
    page: number;
    per_page: number;
    total: number;
}

export interface UsePaginationOptions {
    initialPage?: number;
    initialPerPage?: number;
    initialTotal?: number;
    onChange?: (page: number, perPage: number) => void;
}

export function usePagination(options: UsePaginationOptions = {}) {
    const {
        initialPage = 1,
        initialPerPage = 10,
        initialTotal = 0,
        onChange,
    } = options;

    const [pagination, setPagination] = useState<PaginationState>({
        page: initialPage,
        per_page: initialPerPage,
        total: initialTotal,
    });

    const setPage = useCallback((page: number) => {
        setPagination((prev) => {
            const next = { ...prev, page };
            onChange?.(next.page, next.per_page);
            return next;
        });
    }, [onChange]);

    const setPerPage = useCallback((per_page: number) => {
        setPagination((prev) => {
            const next = { ...prev, per_page, page: 1 };
            onChange?.(next.page, next.per_page);
            return next;
        });
    }, [onChange]);

    const setTotal = useCallback((total: number) => {
        setPagination((prev) => ({ ...prev, total }));
    }, []);

    const handlePageChange = useCallback((page: number, per_page?: number) => {
        setPagination((prev) => {
            const next = {
                ...prev,
                page,
                per_page: per_page ?? prev.per_page,
            };
            onChange?.(next.page, next.per_page);
            return next;
        });
    }, [onChange]);

    const resetPagination = useCallback(() => {
        setPagination({
            page: initialPage,
            per_page: initialPerPage,
            total: 0,
        });
    }, [initialPage, initialPerPage]);

    return {
        pagination,
        setPage,
        setPerPage,
        setTotal,
        handlePageChange,
        resetPagination,
    };
}
