import React, { useEffect, useState } from 'react';
import { Alert, AutoComplete, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import { COMMON_PERMISSION_ACTIONS } from '../configs/permissionOptions';
import { createPermission, CreatePermissionPayload } from '../Action/permission';

const { Text } = Typography;
const { TextArea } = Input;

export interface CreatePermissionModalProps {
	open: boolean;
	modulesList: string[];
	onClose: () => void;
	onSuccess: () => void;
}

export default function CreatePermissionModal({ open, modulesList, onClose, onSuccess }: CreatePermissionModalProps) {
	const [form] = Form.useForm();
	const { act, loading: submitting } = useAction();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const watchedModule = Form.useWatch('module', form) || '';
	const watchedAction = Form.useWatch('action', form) || '';

	useEffect(() => {
		if (open) {
			form.resetFields();
			setErrorMsg(null);
		}
	}, [open, form]);

	// Auto-suggest name and slug when module or action change
	useEffect(() => {
		if (!open) return;
		const currentName = form.getFieldValue('name');
		const currentSlug = form.getFieldValue('slug');

		const cleanModule = watchedModule
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9_]+/g, '_');
		const cleanAction = watchedAction
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9_]+/g, '_');

		if (cleanModule && cleanAction) {
			if (!currentSlug || currentSlug === form.getFieldValue('_auto_slug')) {
				const autoSlug = `${cleanModule}.${cleanAction}`;
				form.setFieldsValue({ slug: autoSlug, _auto_slug: autoSlug });
			}
			if (!currentName || currentName === form.getFieldValue('_auto_name')) {
				const capitalizedAction = cleanAction.charAt(0).toUpperCase() + cleanAction.slice(1);
				const capitalizedModule = cleanModule.charAt(0).toUpperCase() + cleanModule.slice(1);
				const autoName = `${capitalizedAction} ${capitalizedModule}`;
				form.setFieldsValue({ name: autoName, _auto_name: autoName });
			}
		}
	}, [watchedModule, watchedAction, open, form]);

	const handleSubmit = async () => {
		const values = await form.validateFields();
		setErrorMsg(null);

		const payload: CreatePermissionPayload = {
			module: values.module
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9_]+/g, '_'),
			action: values.action
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9_]+/g, '_'),
			name: values.name?.trim(),
			slug: values.slug?.trim(),
			description: values.description?.trim() || undefined,
		};

		await act(() => createPermission(payload), {
			successMessage: `Permission '${payload.slug || `${payload.module}.${payload.action}`}' created successfully.`,
			errorMessage: 'Failed to create permission. Please check inputs.',
			onSuccess: () => {
				onSuccess();
				onClose();
			},
			onError: (err) => setErrorMsg(err?.response?.data?.message || err?.message),
		});
	};

	const moduleOptions = modulesList.map((mod) => ({ value: mod, label: mod }));

	return (
		<Modal
			title={
				<Space>
					<KeyOutlined style={{ color: '#1677ff' }} />
					<Text strong style={{ fontSize: 16 }}>
						Create Individual Permission
					</Text>
				</Space>
			}
			open={open}
			onCancel={onClose}
			onOk={handleSubmit}
			confirmLoading={submitting}
			okText="Create Permission"
			cancelText="Cancel"
			width={540}
			destroyOnClose
		>
			<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
				{errorMsg && <Alert type="error" showIcon message={errorMsg} style={{ marginBottom: 16 }} closable onClose={() => setErrorMsg(null)} />}

				<Form.Item
					name="module"
					label="Module"
					tooltip="Select an existing module or enter a new module name"
					rules={[
						{ required: true, message: 'Please select or enter the module name' },
						{
							pattern: /^[a-zA-Z0-9_-]+$/,
							message: 'Module must contain only letters, numbers, hyphens, and underscores',
						},
					]}
				>
					<AutoComplete
						options={moduleOptions}
						placeholder="Select or enter module (e.g. user, role, crawler)"
						filterOption={(inputValue, option) =>
							String(option?.value ?? '')
								.toUpperCase()
								.indexOf(inputValue.toUpperCase()) !== -1
						}
					/>
				</Form.Item>

				<Form.Item
					name="action"
					label="Action Key"
					tooltip="Select a standard action or enter a custom one (e.g. view, create, export, verify)"
					rules={[
						{ required: true, message: 'Please select or enter the action identifier' },
						{
							pattern: /^[a-zA-Z0-9_-]+$/,
							message: 'Action must contain only letters, numbers, hyphens, and underscores',
						},
					]}
				>
					<AutoComplete
						options={COMMON_PERMISSION_ACTIONS}
						placeholder="Select or type action (e.g. view, edit, export)"
						filterOption={(inputValue, option) =>
							String(option?.value ?? '')
								.toUpperCase()
								.indexOf(inputValue.toUpperCase()) !== -1
						}
					/>
				</Form.Item>

				<Form.Item name="name" label="Permission Display Name" tooltip="User-friendly name shown in roles matrix and permission assignments" rules={[{ required: true, message: 'Please enter a display name' }]}>
					<Input placeholder="e.g. Export Crawl Data, View User List" />
				</Form.Item>

				<Form.Item
					name="slug"
					label="Permission Slug"
					tooltip="Unique identifier used for authorization checks: module.action (e.g. user.view, crawler.export)"
					rules={[
						{ required: true, message: 'Please enter permission slug' },
						{
							pattern: /^[a-zA-Z0-9_.-]+$/,
							message: 'Slug can only contain letters, numbers, dots, and hyphens/underscores',
						},
					]}
				>
					<Input placeholder="e.g. user.view, crawler.export" disabled={true} />
				</Form.Item>

				<Form.Item name="description" label="Description">
					<TextArea rows={2} placeholder="Optional description of this permission scope" />
				</Form.Item>

				{watchedModule && watchedAction && (
					<div
						style={{
							background: '#fafafa',
							padding: '10px 14px',
							borderRadius: 6,
							border: '1px solid #f0f0f0',
						}}
					>
						<Space>
							<CheckCircleOutlined style={{ color: '#52c41a' }} />
							<Text type="secondary" style={{ fontSize: 13 }}>
								Preview Slug:{' '}
								<Text code strong>
									{watchedModule
										.trim()
										.toLowerCase()
										.replace(/[^a-z0-9_]+/g, '_')}
									.
									{watchedAction
										.trim()
										.toLowerCase()
										.replace(/[^a-z0-9_]+/g, '_')}
								</Text>
							</Text>
						</Space>
					</div>
				)}
			</Form>
		</Modal>
	);
}
