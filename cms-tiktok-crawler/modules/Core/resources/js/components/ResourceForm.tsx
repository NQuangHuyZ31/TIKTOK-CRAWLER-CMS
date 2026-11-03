import React, { ReactNode } from 'react';
import { Alert, Button, Card, Form, FormInstance, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import FormContent from './resourceForm/FormContent';
import ResourceFormActions from './resourceForm/ResourceFormActions';
import { useResourceForm } from './resourceForm/useResourceForm';

export interface ResourceFormRenderContext<T = any> {
	form: FormInstance;
	isEdit: boolean;
	id?: string;
	record: T | null;
}

export type ResourceFormChildren<T = any> = ReactNode | ((context: ResourceFormRenderContext<T>) => ReactNode);

export interface ResourceFormProps<T = any> {
	isEdit?: boolean;
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
	const navigate = useNavigate();
	const { form, id, isEdit, record, loading, submitting, fetchError, loadRecord, handleFinish } = useResourceForm<T>({
		propId,
		propIsEdit,
		externalForm,
		initialValues,
		fetchRecord,
		transformInitialValues,
		resourceName,
		onSubmit,
		onCreate,
		onUpdate,
		onSuccess,
		redirectUrl,
		backUrl,
	});

	const handleBack = () => {
		if (onBack) return onBack();
		if (backUrl) return navigate(backUrl);
		navigate(-1);
	};

	const resolvedTitle = title ?? (isEdit ? `Edit ${resourceName} #${id}` : `Create ${resourceName}`);
	const resolvedSubtitle = subtitle ?? (isEdit ? `Update details for this ${resourceName.toLowerCase()}.` : `Fill in the form to create a new ${resourceName.toLowerCase()}.`);

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
						action={<Button size="small" danger icon={<ReloadOutlined />} onClick={loadRecord}>Retry</Button>}
					/>
				)}

				{loading ? (
					<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
						<Spin size="large" />
					</div>
				) : (
					<Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish} requiredMark="optional">
						{typeof children === 'function' ? <FormContent renderFn={children} context={{ form, isEdit, id, record }} /> : children}
						<ResourceFormActions
							showCancel={showCancel}
							cancelText={cancelText}
							submitting={submitting}
							loading={loading}
							resolvedSubmitText={submitText ?? (isEdit ? 'Save Changes' : `Create ${resourceName}`)}
							extraActions={extraActions}
							onBack={handleBack}
						/>
					</Form>
				)}
			</Card>
		</div>
	);
}
