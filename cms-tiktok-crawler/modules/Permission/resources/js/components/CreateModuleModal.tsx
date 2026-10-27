import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal, Space, Typography, App as AntdApp } from 'antd';
import { AppstoreAddOutlined, CheckOutlined } from '@ant-design/icons';
import { createModulePermissions } from '../Action/permission';

const { Text } = Typography;
const { TextArea } = Input;

export interface CreateModuleModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const BASIC_ACTIONS = [
	{ label: 'View (view)', value: 'view', desc: 'Read-only access and data listing' },
	{ label: 'Create (create)', value: 'create', desc: 'Add new records and entities' },
	{ label: 'Edit (edit)', value: 'edit', desc: 'Modify existing records' },
	{ label: 'Delete (delete)', value: 'delete', desc: 'Permanently remove records' },
];

export default function CreateModuleModal({ open, onClose, onSuccess }: CreateModuleModalProps) {
	const { message } = AntdApp.useApp();
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const watchedModule = Form.useWatch('module', form) || '';
	const watchedActions = Form.useWatch('actions', form) || [];

	useEffect(() => {
		if (open) {
			form.resetFields();
			form.setFieldsValue({
				actions: ['view', 'create', 'edit', 'delete'],
			});
			setErrorMsg(null);
		}
	}, [open, form]);

	const handleSelectAll = () => {
		form.setFieldsValue({ actions: ['view', 'create', 'edit', 'delete'] });
	};

	const handleDeselectAll = () => {
		form.setFieldsValue({ actions: [] });
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);
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

			await createModulePermissions(payload);
			message.success(`Module '${payload.module}' with ${payload.actions.length} permissions created successfully.`);

			onSuccess();
			onClose();
		} catch (err: any) {
			const msg = err?.response?.data?.message || err?.message || 'Failed to create module permissions. Please check inputs.';
			setErrorMsg(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			title={
				<Space>
					<AppstoreAddOutlined style={{ color: '#1677ff' }} />
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

				<Form.Item
					name="actions"
					label={
						<Space style={{ width: '100%', justifyContent: 'space-between' }}>
							<span>Basic Permissions</span>
							<Space size="small">
								<Button type="link" size="small" onClick={handleSelectAll} style={{ padding: 0 }}>
									Select All
								</Button>
								<Text type="secondary">|</Text>
								<Button type="link" size="small" onClick={handleDeselectAll} style={{ padding: 0 }}>
									Deselect All
								</Button>
							</Space>
						</Space>
					}
					rules={[{ required: true, message: 'Please select at least one permission action' }]}
				>
					<Checkbox.Group style={{ width: '100%' }}>
						<Space orientation="vertical" style={{ width: '100%' }}>
							{BASIC_ACTIONS.map((item) => (
								<Checkbox key={item.value} value={item.value}>
									<Space direction="vertical" size={0}>
										<Text strong>{item.label}</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>
											{item.desc}
										</Text>
									</Space>
								</Checkbox>
							))}
						</Space>
					</Checkbox.Group>
				</Form.Item>

				<Form.Item name="description" label="Description">
					<TextArea rows={2} placeholder="Optional notes about this module's responsibilities" />
				</Form.Item>

				{watchedModule && watchedActions.length > 0 && (
					<div
						style={{
							background: '#fafafa',
							padding: '12px 16px',
							borderRadius: 6,
							border: '1px solid #f0f0f0',
						}}
					>
						<Text type="secondary" style={{ fontSize: 12 }}>
							Permissions to be created:
						</Text>
						<div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
							{watchedActions.map((act: string) => (
								<span
									key={act}
									style={{
										background: '#e6f4ff',
										color: '#0958d9',
										padding: '2px 8px',
										borderRadius: 4,
										fontFamily: 'monospace',
										fontSize: 12,
									}}
								>
									<CheckOutlined style={{ marginRight: 4, fontSize: 10 }} />
									{watchedModule
										.trim()
										.toLowerCase()
										.replace(/[^a-z0-9_]+/g, '_')}
									.{act}
								</span>
							))}
						</div>
					</div>
				)}
			</Form>
		</Modal>
	);
}
