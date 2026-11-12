import React, { useEffect, useState } from 'react';
import { Alert, Form, Input, Modal, Space, Typography } from 'antd';
import { AppstoreAddOutlined } from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import { BASIC_PERMISSION_ACTIONS } from '../configs/permissionOptions';
import { createModulePermissions } from '../Action/permission';
import ModulePermissionsPreview from './createModule/ModulePermissionsPreview';
import ModulePermissionsSelect from './createModule/ModulePermissionsSelect';

const { Text } = Typography;
const { TextArea } = Input;

export interface CreateModuleModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function CreateModuleModal({ open, onClose, onSuccess }: CreateModuleModalProps) {
	const [form] = Form.useForm();
	const { act, loading: submitting } = useAction();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const watchedModule = Form.useWatch('module', form) || '';
	const watchedActions = Form.useWatch('actions', form) || [];

	useEffect(() => {
		if (open) {
			form.resetFields();
			form.setFieldsValue({
				actions: BASIC_PERMISSION_ACTIONS.map((a) => a.value),
			});
			setErrorMsg(null);
		}
	}, [open, form]);

	const handleSelectAll = () => {
		form.setFieldsValue({ actions: BASIC_PERMISSION_ACTIONS.map((a) => a.value) });
	};

	const handleDeselectAll = () => {
		form.setFieldsValue({ actions: [] });
	};

	const handleSubmit = async () => {
		const values = await form.validateFields();
		setErrorMsg(null);

		const payload = {
			module: values.module
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9_]+/g, '_'),
			name: values.name?.trim() || undefined,
			actions: values.actions,
			description: values.description?.trim() || undefined,
		};

		await act(
			() => createModulePermissions(payload),
			{
				successMessage: `Module '${payload.module}' with ${payload.actions.length} permissions created successfully.`,
				errorMessage: 'Failed to create module permissions. Please check inputs.',
				onSuccess: () => {
					onSuccess();
					onClose();
				},
				onError: (err) => setErrorMsg(err?.response?.data?.message || err?.message),
			}
		);
	};

	return (
		<Modal
			title={
				<Space>
					<AppstoreAddOutlined style={{ color: '#EC008C' }} />
					<Text strong style={{ fontSize: 16 }}>
						Create Module & Basic Permissions
					</Text>
				</Space>
			}
			open={open}
			onCancel={onClose}
			onOk={handleSubmit}
			confirmLoading={submitting}
			okText="Create Module"
			cancelText="Cancel"
			width={580}
			destroyOnClose
		>
			<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
				{errorMsg && <Alert type="error" showIcon message={errorMsg} style={{ marginBottom: 16 }} closable onClose={() => setErrorMsg(null)} />}

				<Form.Item
					name="module"
					label="Module Key (System Identifier)"
					tooltip="Lowercase snake_case name of the module, e.g. report, audit_log, media"
					rules={[
						{ required: true, message: 'Please enter the module identifier' },
						{
							pattern: /^[a-zA-Z0-9_-]+$/,
							message: 'Module key must contain only letters, numbers, hyphens, and underscores',
						},
					]}
				>
					<Input placeholder="e.g. report, audit_log, billing" />
				</Form.Item>

				<Form.Item name="name" label="Module Display Name" tooltip="Human-readable title displayed in navigation and matrices">
					<Input placeholder="e.g. Reports & Analytics, Audit Logs" />
				</Form.Item>

				<ModulePermissionsSelect onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} />

				<Form.Item name="description" label="Description">
					<TextArea rows={2} placeholder="Optional notes about this module's responsibilities" />
				</Form.Item>

				<ModulePermissionsPreview watchedModule={watchedModule} watchedActions={watchedActions} />
			</Form>
		</Modal>
	);
}
