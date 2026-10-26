import { App as AntdApp, message as staticMessage } from 'antd';
import { useCallback, useState } from 'react';

export interface UseActionOptions<TParams = any, TResult = any> {
	successMessage?: string | ((result: TResult, params: TParams) => string);
	errorMessage?: string;
	onSuccess?: (result: TResult, params: TParams) => any;
}

/**
 * Concise Action Execution Hook
 * Calls an API function, displays success/error notification, and executes an optional callback.
 *
 * Example:
 * const { execute: handleDelete, loading } = useAction(
 *     (role: RoleItem) => deleteRole(role.id),
 *     'Role deleted successfully',
 *     () => dispatch(fetchRoles(params))
 * );
 */
export function useAction<TParams = any, TResult = any>(
	api: (params: TParams) => Promise<TResult>,
	successMessageOrOptions?: string | UseActionOptions<TParams, TResult>,
	callback?: (result: TResult, params: TParams) => any,
) {
	const [loading, setLoading] = useState(false);

	let messageApi: any;
	try {
		const app = AntdApp.useApp();
		messageApi = app.message;
	} catch {
		messageApi = staticMessage;
	}

	const options: UseActionOptions<TParams, TResult> =
		typeof successMessageOrOptions === 'string'
			? { successMessage: successMessageOrOptions, onSuccess: callback }
			: successMessageOrOptions || {};

	const execute = useCallback(
		async (params: TParams): Promise<TResult | undefined> => {
			setLoading(true);
			try {
				const result = await api(params);
				const msg =
					typeof options.successMessage === 'function'
						? options.successMessage(result, params)
						: options.successMessage || (result as any)?.message || 'Action executed successfully';

				if (msg) {
					messageApi?.success(msg);
				}

				if (options.onSuccess) {
					await options.onSuccess(result, params);
				}

				return result;
			} catch (err: any) {
				const errorMsg =
					err?.response?.data?.message || err?.message || options.errorMessage || 'Action failed';
				messageApi?.error(errorMsg);
				return undefined;
			} finally {
				setLoading(false);
			}
		},
		[api, options, messageApi],
	);

	return { execute, loading };
}

export default useAction;
