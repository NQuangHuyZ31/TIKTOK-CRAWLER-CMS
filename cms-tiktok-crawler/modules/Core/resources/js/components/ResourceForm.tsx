import React, { ReactNode, useEffect, useState } from 'react';
import { Alert, Button, Card, Flex, Form, FormInstance, Space, Spin, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from './PageHeader';

export interface ResourceFormRenderContext<T = any> {
	form: FormInstance;
	isEdit: boolean;
	id?: string;
	record: T | null;
}

export type ResourceFormChildren<T = any> =
	| ReactNode
	| ((context: ResourceFormRenderContext<T>) => ReactNode);

export interface ResourceFormProps<T = any> {
	/** Explicit edit mode override. If omitted, inferred from route: `/create` is false, `/:id/edit` is true */
	isEdit?: boolean;
	/** Explicit record ID override. If omitted, inferred from route params `:id` */
	id?: string | number;

	resourceName?: string;
	title?: ReactNode;
	subtitle?: ReactNode;
	backUrl?: string;
	onBack?: () => void;

	fetchRecord?: (id: string | number) => Promise<any>;
	transformInitialValues?: (rawRecord: any) => any;
	initialValues?: Record<string, any>;

	form?: FormInstance;
	onSubmit?: (values: any, isEdit: boolean, id?: string) => Promise<any> | void;
	onCreate?: (values: any) => Promise<any> | void;
	onUpdate?: (id: string, values: any, record: T | null) => Promise<any> | void;
	redirectUrl?: string | ((result: any, isEdit: boolean, id?: string) => string | false);
	onSuccess?: (result: any) => void;

	submitText?: ReactNode;
	cancelText?: ReactNode;
	showCancel?: boolean;
	extraActions?: ReactNode;

	children?: ResourceFormChildren<T>;
}

/**
 * Isolated renderer for function children so hooks called by render functions
 * belong to this sub-component rather than leaking into ResourceForm's hook stack.
 */
function FormContent<T>({
	renderFn,
	context,
}: {
	renderFn: (context: ResourceFormRenderContext<T>) => ReactNode;
	context: ResourceFormRenderContext<T>;
}) {
	return <>{renderFn(context)}</>;
}

/**
 * Minimalist, unified ResourceForm component.
 * Automatically switches between Create (`/create`) and Edit (`/:id/edit`) modes based on route.
 */
export default function ResourceForm<T = any>({
	isEdit: propIsEdit,
	id: propId,
	resourceName = 'Record',
	title,
	subtitle,
	backUrl,
	onBack,
	fetchRecord,
	transformInitialValues,
	initialValues,
	form: externalForm,
	onSubmit,
	onCreate,
	onUpdate,
	redirectUrl,
	onSuccess,
	submitText,
	cancelText = 'Cancel',
	showCancel = true,
	extraActions,
	children,
}: ResourceFormProps<T>) {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams<{ id?: string }>();

	// Normalize ID: discard literal string "create" if captured by greedy routing
	const rawId = propId !== undefined ? String(propId) : params.id;
	const id = rawId && rawId.toLowerCase() !== 'create' ? rawId : undefined;

	// Inferred or explicit isEdit:
	// - /create -> isEdit = false
	// - /:id/edit or /1/edit -> isEdit = true
	const isEdit = propIsEdit !== undefined ? propIsEdit : Boolean(id && (location.pathname.endsWith('/edit') || !location.pathname.endsWith('/create')));

	const [internalForm] = Form.useForm();
	const form = externalForm || internalForm;

	const [record, setRecord] = useState<T | null>(null);
	const [loading, setLoading] = useState<boolean>(isEdit && Boolean(fetchRecord));
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// Load existing record for Edit mode
	const loadRecord = async () => {
		if (!isEdit || !id || !fetchRecord) {
			form.resetFields();
			if (initialValues) {
				form.setFieldsValue(initialValues);
			}
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

	// Back Navigation
	const handleBack = () => {
		if (onBack) {
			onBack();
			return;
		}
		if (backUrl) {
			navigate(backUrl);
			return;
		}
		navigate(-1);
	};

	// Form Submission
	const handleFinish = async (values: any) => {
		setSubmitting(true);
		try {
			let result: any = null;

			if (onSubmit) {
				result = await onSubmit(values, isEdit, id);
			} else if (isEdit && onUpdate && id) {
				result = await onUpdate(id, values, record);
			} else if (!isEdit && onCreate) {
				result = await onCreate(values);
			}

			const defaultSuccess = isEdit ? `${resourceName} updated successfully` : `${resourceName} created successfully`;
			message.success(result?.message || defaultSuccess);

			onSuccess?.(result);

			if (redirectUrl) {
				const target = typeof redirectUrl === 'function' ? redirectUrl(result, isEdit, id) : redirectUrl;
				if (target) {
					navigate(target);
				}
			} else if (backUrl) {
				navigate(backUrl);
			}
		} catch (err: any) {
			const defaultError = isEdit ? `Failed to update ${resourceName.toLowerCase()}` : `Failed to create ${resourceName.toLowerCase()}`;
			message.error(err?.response?.data?.message || err?.message || defaultError);
		} finally {
			setSubmitting(false);
		}
	};

	const resolvedTitle = title ?? (isEdit ? `Edit ${resourceName} #${id}` : `Create ${resourceName}`);
	const resolvedSubtitle = subtitle ?? (isEdit ? `Update details for this ${resourceName.toLowerCase()}.` : `Fill in the form to create a new ${resourceName.toLowerCase()}.`);
	const resolvedSubmitText = submitText ?? (isEdit ? 'Save Changes' : `Create ${resourceName}`);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader title={resolvedTitle} subtitle={resolvedSubtitle} onBack={handleBack} />

			<Card>
				{fetchError && (
					<Alert
						type="error"
						title="Failed to Load Data"
						description={fetchError}
						showIcon
						style={{ marginBottom: 20 }}
						action={
							<Button size="small" danger icon={<ReloadOutlined />} onClick={loadRecord}>
								Retry
							</Button>
						}
					/>
				)}

				{loading ? (
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
						<Spin size="large" />
					</div>
				) : (
					<Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish} requiredMark="optional">
						{/* Fields rendered directly as <Form.Item> in children */}
						{typeof children === 'function' ? (
							<FormContent renderFn={children} context={{ form, isEdit, id, record }} />
						) : (
							children
						)}

						<Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 24 }}>
							<Space wrap size="middle">
								{showCancel && (
									<Button icon={<ArrowLeftOutlined />} onClick={handleBack} disabled={submitting}>
										{cancelText}
									</Button>
								)}
								{extraActions}
							</Space>
							<Space wrap size="middle">
								<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} disabled={loading}>
									{resolvedSubmitText}
								</Button>
							</Space>
						</Flex>
					</Form>
				)}
			</Card>
		</div>
	);
}
