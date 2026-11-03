import { useEffect, useState } from 'react';
import { Form, FormInstance } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAction from '../../hooks/useAction';

export interface UseResourceFormProps<T> {
	propId?: string | number;
	propIsEdit?: boolean;
	externalForm?: FormInstance;
	initialValues?: Record<string, any>;
	fetchRecord?: (id: string | number) => Promise<any>;
	transformInitialValues?: (rawRecord: any) => any;
	resourceName?: string;
	onSubmit?: (values: any, isEdit: boolean, id?: string) => Promise<any> | void;
	onCreate?: (values: any) => Promise<any> | void;
	onUpdate?: (id: string, values: any, record: T | null) => Promise<any> | void;
	onSuccess?: (result: any) => void;
	redirectUrl?: string | ((result: any, isEdit: boolean, id?: string) => string | false);
	backUrl?: string;
}

export function useResourceForm<T = any>({
	propId,
	propIsEdit,
	externalForm,
	initialValues,
	fetchRecord,
	transformInitialValues,
	resourceName = 'Record',
	onSubmit,
	onCreate,
	onUpdate,
	onSuccess,
	redirectUrl,
	backUrl,
}: UseResourceFormProps<T>) {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams<{ id?: string }>();
	const { act, loading: submitting } = useAction();

	const rawId = propId !== undefined ? String(propId) : params.id;
	const id = rawId && rawId.toLowerCase() !== 'create' ? rawId : undefined;
	const isEdit = propIsEdit !== undefined ? propIsEdit : Boolean(id && (location.pathname.endsWith('/edit') || !location.pathname.endsWith('/create')));

	const [internalForm] = Form.useForm();
	const form = externalForm || internalForm;

	const [record, setRecord] = useState<T | null>(null);
	const [loading, setLoading] = useState<boolean>(isEdit && Boolean(fetchRecord));
	const [fetchError, setFetchError] = useState<string | null>(null);

	const loadRecord = async () => {
		if (!isEdit || !id || !fetchRecord) {
			form.resetFields();
			if (initialValues) form.setFieldsValue(initialValues);
			setRecord(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setFetchError(null);
		try {
			const res = await fetchRecord(id);
			const rawData = res?.data ?? res;
			const values = transformInitialValues ? transformInitialValues(rawData) : rawData;
			setRecord(rawData);
			form.setFieldsValue(values);
		} catch (err: any) {
			setFetchError(err?.response?.data?.message || err?.message || `Failed to load ${resourceName.toLowerCase()}`);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRecord();
	}, [id, isEdit]);

	const handleFinish = async (values: any) => {
		const submitFn = async () => {
			if (onSubmit) return await onSubmit(values, isEdit, id);
			if (isEdit && onUpdate && id) return await onUpdate(id, values, record);
			if (!isEdit && onCreate) return await onCreate(values);
			return null;
		};

		await act(submitFn, {
			successMessage: isEdit ? `${resourceName} updated successfully` : `${resourceName} created successfully`,
			errorMessage: isEdit ? `Failed to update ${resourceName.toLowerCase()}` : `Failed to create ${resourceName.toLowerCase()}`,
			onSuccess: (result) => {
				onSuccess?.(result);
				const target = typeof redirectUrl === 'function' ? redirectUrl(result, isEdit, id) : redirectUrl;
				if (target) navigate(target);
				else if (backUrl) navigate(backUrl);
			},
		});
	};

	return {
		form,
		id,
		isEdit,
		record,
		loading,
		submitting,
		fetchError,
		loadRecord,
		handleFinish,
	};
}
