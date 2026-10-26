import { App as AntdApp, message as staticMessage } from 'antd';
import { useCallback, useState } from 'react';

export interface ActionConfig<TResult = any, TParams = any> {
    successMessage?: string | ((result: TResult, params?: TParams) => string);
    errorMessage?: string;
    onSuccess?: (result: TResult, params?: TParams) => any | Promise<any>;
    onError?: (error: any) => any;
}

export type UseActionOptions<TParams = any, TResult = any> = ActionConfig<TResult, TParams>;

/**
 * Concise action execution hook.
 * Supports both pre-bound style:
 *   const { execute, loading } = useAction((item) => deleteItem(item.id), options);
 * And call-site style:
 *   const { execute, loading } = useAction();
 *   execute(() => deleteItem(id), options);
 */
export function useAction<TParams = any, TResult = any>(
    boundApi?: (params: TParams) => Promise<TResult>,
    boundOptions?: string | ActionConfig<TResult, TParams>,
    boundCallback?: (result: TResult, params?: TParams) => any
) {
    const [loading, setLoading] = useState(false);

    let messageApi: any;
    try {
        const antdApp = AntdApp.useApp();
        messageApi = antdApp?.message || staticMessage;
    } catch {
        messageApi = staticMessage;
    }

    const execute = useCallback(
        async (
            apiOrParams?: any,
            options?: string | ActionConfig<any>,
            callback?: (result: any) => any
        ): Promise<any> => {
            // Determine if called with (params) using boundApi, or (api, options, callback)
            let apiFn: () => Promise<any>;
            let config: ActionConfig<any> = {};

            if (boundApi) {
                const params = apiOrParams;
                apiFn = () => boundApi(params);
                config =
                    typeof boundOptions === 'string'
                        ? { successMessage: boundOptions, onSuccess: boundCallback }
                        : boundOptions || {};
            } else if (typeof apiOrParams === 'function') {
                apiFn = apiOrParams;
                config =
                    typeof options === 'string'
                        ? { successMessage: options, onSuccess: callback }
                        : options || {};
            } else {
                throw new Error('useAction: Missing API execution function.');
            }

            setLoading(true);
            try {
                const result = await apiFn();

                const msg =
                    typeof config.successMessage === 'function'
                        ? (config.successMessage as any)(result, apiOrParams)
                        : config.successMessage ?? (result as any)?.message ?? 'Action executed successfully';

                if (msg) {
                    messageApi?.success(msg);
                }

                if (config.onSuccess) {
                    await (config.onSuccess as any)(result, apiOrParams);
                }

                return result;
            } catch (err: any) {
                const errorMsg =
                    err?.response?.data?.message || err?.message || config.errorMessage || 'Action failed';

                messageApi?.error(errorMsg);

                if (config.onError) {
                    config.onError(err);
                }

                return undefined;
            } finally {
                setLoading(false);
            }
        },
        [boundApi, boundOptions, boundCallback, messageApi]
    );

    return { execute, loading };
}

export default useAction;
