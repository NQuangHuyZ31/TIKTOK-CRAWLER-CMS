import { useState, useCallback } from 'react';

export interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: any;
}

export function useAsync<T = any, Args extends any[] = any[]>(
    asyncFunction: (...args: Args) => Promise<T>
) {
    const [state, setState] = useState<UseAsyncState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(
        async (...args: Args): Promise<T> => {
            setState({ data: null, loading: true, error: null });
            try {
                const response = await asyncFunction(...args);
                setState({ data: response, loading: false, error: null });
                return response;
            } catch (error: any) {
                setState({ data: null, loading: false, error });
                throw error;
            }
        },
        [asyncFunction]
    );

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}
