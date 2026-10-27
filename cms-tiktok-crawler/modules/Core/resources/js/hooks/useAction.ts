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
 *
 * Supports 3 flexible usage patterns:
 * 1. Pre-bound API action:
 *    const { execute: handleDelete } = useAction((user: User) => deleteUser(user.id), 'User deleted', loadUsers);
 *
 * 2. Pre-bound reload action (Ureka act style):
 *    const { act, loading } = useAction(loadUsers);
 *    act(() => deleteUser(id), 'User deleted');
 *
 * 3. Call-site execution:
 *    const { act, loading } = useAction();
 *    act(() => deleteUser(id), 'User deleted', loadUsers);
 */
export function useAction<TParams = any, TResult = any>(
    boundApiOrReload?: ((params: TParams) => Promise<TResult>) | (() => any),
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
            let apiFn: () => Promise<any>;
            let config: ActionConfig<any> = {};

            // Case 1: Pre-bound API: useAction(deleteItem, 'Success', reload) -> execute(item)
            if (boundApiOrReload && typeof boundApiOrReload === 'function' && (boundOptions || boundCallback)) {
                const params = apiOrParams;
                apiFn = () => (boundApiOrReload as (p: any) => Promise<any>)(params);
                config =
                    typeof boundOptions === 'string'
                        ? { successMessage: boundOptions, onSuccess: boundCallback }
                        : boundOptions || {};
            }
            // Case 2: Pre-bound reload: const { act } = useAction(reload) -> act(() => deleteItem(id), 'Success')
            else if (boundApiOrReload && typeof boundApiOrReload === 'function' && typeof apiOrParams === 'function') {
                apiFn = apiOrParams;
                config =
                    typeof options === 'string'
                        ? { successMessage: options, onSuccess: callback || boundApiOrReload }
                        : { onSuccess: boundApiOrReload, ...options };
            }
            // Case 3: Call-site: const { act } = useAction() -> act(() => deleteItem(id), 'Success', callback)
            else if (typeof apiOrParams === 'function') {
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
                        : config.successMessage ?? (result as any)?.message;

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
        [boundApiOrReload, boundOptions, boundCallback, messageApi]
    );

    return { execute, act: execute, loading };
}

export const useAct = useAction;
export default useAction;
