import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	App,
	Button,
	Checkbox,
	Col,
	Divider,
	Form,
	Input,
	InputNumber,
	Modal,
	Radio,
	Row,
	Select,
	Space,
	Typography,
} from 'antd';
import {
	AppstoreAddOutlined,
	DeleteOutlined,
	PlusOutlined,
} from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import { useMenuRoutes } from '@core/routes/registry';
import { SIDEBAR_ICON_OPTIONS } from '@core/configs/systemOptions';
import { toKebabCase, toSnakeCase, toStudlyCase } from '@core/utils/formatString';
import { BASIC_PERMISSION_ACTIONS } from '@modules/Permission/resources/js/configs/permissionOptions';
import { scaffoldModule, type ScaffoldModulePayload } from '../Action/moduleManager';

const { Text } = Typography;
const { TextArea } = Input;

export interface CreateModuleModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function CreateModuleModal({ open, onClose, onSuccess }: CreateModuleModalProps) {
	const [form] = Form.useForm();
	const { notification } = App.useApp();
	const { act, loading: submitting } = useAction();
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const menuRoutes = useMenuRoutes();

	const watchedModule = Form.useWatch('module', form) || '';
	const watchedPlacement = Form.useWatch('menu_placement', form) || 'top';
	const watchedCreatePerms = Form.useWatch('create_permissions', form) ?? true;

	const parentMenuOptions = useMemo(
		() =>
			menuRoutes
				.filter((r) => Boolean(r.path) && Boolean(r.label))
				.map((r) => ({
					value: r.path,
					label: `${r.label} (${r.path})`,
				})),
		[menuRoutes]
	);

	const studlyModuleName = toStudlyCase(watchedModule) || 'ModuleName';

	useEffect(() => {
		if (open) {
			form.resetFields();
			form.setFieldsValue({
				icon: 'AppstoreOutlined',
				order: 100,
				menu_placement: 'top',
				create_permissions: true,
				permissions: ['view', 'create', 'edit', 'delete'],
				submenus: [],
			});
			setErrorMsg(null);
		}
	}, [open, form]);

	const handleSubmit = async () => {
		const values = await form.validateFields();
		setErrorMsg(null);

		const moduleKey = toSnakeCase(values.module);
		const menuPlacement = values.menu_placement === 'submenu' ? 'submenu' : 'top';

		const payload: ScaffoldModulePayload = {
			module: moduleKey,
			name: values.name?.trim() || undefined,
			description: values.description?.trim() || undefined,
			route_path: values.route_path?.trim() || `/${toKebabCase(moduleKey)}`,
			icon: values.icon || 'AppstoreOutlined',
			order: typeof values.order === 'number' ? values.order : 100,
			menu_placement: menuPlacement,
			create_permissions: Boolean(values.create_permissions),
			permissions: values.create_permissions ? values.permissions : undefined,
		};

		if (menuPlacement === 'submenu') {
			payload.parent_path = values.parent_path;
		} else if (Array.isArray(values.submenus) && values.submenus.length > 0) {
			payload.submenus = values.submenus
				.filter((item: any) => item?.label?.trim() && item?.path?.trim())
				.map((item: any) => ({
					label: item.label.trim(),
					path: item.path.trim(),
					icon: item.icon || 'AppstoreOutlined',
				}));
		}

		await act(() => scaffoldModule(payload), {
			successMessage: `Module '${studlyModuleName}' scaffolded successfully.`,
			errorMessage: 'Failed to scaffold module. Please check inputs.',
			onSuccess: (res: any) => {
				const scaffold = res?.data;
				if (scaffold?.build_command) {
					notification.info({
						message: `Module '${scaffold.module_name}' Created`,
						description: (
							<span>
								Generated {scaffold.created_files?.length ?? 0} file(s). Run{' '}
								<Text code>{scaffold.build_command}</Text> and refresh the page to show it on the sidebar.
							</span>
						),
						duration: 12,
					});
				}
				onSuccess();
				onClose();
			},
			onError: (err) => setErrorMsg(err?.response?.data?.message || err?.message),
		});
	};

	return (
		<Modal
			title={
				<Space>
					<AppstoreAddOutlined style={{ color: '#EC008C' }} />
					<Text strong style={{ fontSize: 16 }}>
						Create New Module &amp; Scaffolding
					</Text>
				</Space>
			}
			open={open}
			onCancel={onClose}
			onOk={handleSubmit}
			confirmLoading={submitting}
			okText="Create & Scaffold"
			cancelText="Cancel"
			width={660}
			destroyOnClose
		>
			<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
				{errorMsg && <Alert type="error" showIcon message={errorMsg} style={{ marginBottom: 16 }} closable onClose={() => setErrorMsg(null)} />}

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="module"
							label="Module Key (System Identifier)"
							tooltip="Lowercase snake_case or kebab-case identifier, e.g. report, campaign, billing"
							rules={[
								{ required: true, message: 'Please enter the module identifier' },
								{
									pattern: /^[a-zA-Z0-9_-]+$/,
									message: 'Module key must contain only letters, numbers, hyphens, and underscores',
								},
							]}
						>
							<Input placeholder="e.g. campaign, audit_log, report" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item name="name" label="Display Name" tooltip="Human-readable title displayed on the sidebar">
							<Input placeholder="e.g. Campaign Management, Reports" />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col span={12}>
						<Form.Item
							name="route_path"
							label="Route Path"
							tooltip="Frontend URL path for main page, e.g. /campaign or /report"
						>
							<Input placeholder={watchedModule ? `/${toKebabCase(watchedModule)}` : '/module-name'} />
						</Form.Item>
					</Col>
					<Col span={7}>
						<Form.Item name="icon" label="Sidebar Icon">
							<Select
								options={SIDEBAR_ICON_OPTIONS.map((opt) => ({
									value: opt.value,
									label: (
										<Space size={6}>
											{opt.icon}
											<span>{opt.label}</span>
										</Space>
									),
								}))}
							/>
						</Form.Item>
					</Col>
					<Col span={5}>
						<Form.Item name="order" label="Order">
							<InputNumber min={0} max={9999} style={{ width: '100%' }} />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item name="description" label="Description">
					<TextArea rows={2} placeholder="Brief summary of this module's responsibilities" />
				</Form.Item>

				<Divider style={{ margin: '12px 0' }} />

				<Form.Item name="menu_placement" label="Sidebar Menu Placement" style={{ marginBottom: 12 }}>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio.Button value="top">Top-level Menu</Radio.Button>
						<Radio.Button value="submenu">Submenu under Parent</Radio.Button>
					</Radio.Group>
				</Form.Item>

				{watchedPlacement === 'submenu' ? (
					<Form.Item name="parent_path" label="Parent Menu" rules={[{ required: true, message: 'Please select a parent menu' }]}>
						<Select showSearch placeholder="Select parent sidebar menu (e.g. /system, /user)" options={parentMenuOptions} />
					</Form.Item>
				) : (
					<Form.List name="submenus">
						{(fields, { add, remove }) => (
							<div style={{ marginTop: 4, marginBottom: 12 }}>
								<Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
									<Col>
										<Text strong style={{ fontSize: 13 }}>
											Child Submenus (Optional)
										</Text>
									</Col>
									<Col>
										<Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => add({ label: '', path: '', icon: 'AppstoreOutlined' })}>
											Add Submenu
										</Button>
									</Col>
								</Row>

								{fields.map(({ key, name, ...restField }) => (
									<Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
										<Col span={8}>
											<Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label required' }]} style={{ marginBottom: 0 }}>
												<Input placeholder="Submenu label (e.g. Overview)" />
											</Form.Item>
										</Col>
										<Col span={8}>
											<Form.Item {...restField} name={[name, 'path']} rules={[{ required: true, message: 'Path required' }]} style={{ marginBottom: 0 }}>
												<Input placeholder="Path (e.g. /report/daily)" />
											</Form.Item>
										</Col>
										<Col span={6}>
											<Form.Item {...restField} name={[name, 'icon']} style={{ marginBottom: 0 }}>
												<Select
													placeholder="Icon"
													options={SIDEBAR_ICON_OPTIONS.map((opt) => ({
														value: opt.value,
														label: (
															<Space size={6}>
																{opt.icon}
																<span>{opt.label}</span>
															</Space>
														),
													}))}
												/>
											</Form.Item>
										</Col>
										<Col span={2} style={{ textAlign: 'right' }}>
											<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
										</Col>
									</Row>
								))}
							</div>
						)}
					</Form.List>
				)}

				<Divider style={{ margin: '12px 0' }} />

				<Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
					<Col>
						<Form.Item name="create_permissions" valuePropName="checked" style={{ marginBottom: 0 }}>
							<Checkbox>Generate Basic Permissions in Database</Checkbox>
						</Form.Item>
					</Col>
				</Row>

				{watchedCreatePerms && (
					<Form.Item name="permissions" style={{ marginBottom: 12 }}>
						<Checkbox.Group
							options={BASIC_PERMISSION_ACTIONS.map((a) => ({
								label: a.label,
								value: a.value,
							}))}
						/>
					</Form.Item>
				)}

				<Alert
					type="info"
					showIcon
					message="Manual Build Required"
					description={
						<span>
							After creation, run <Text code>{`node scripts/mix-module.cjs ${studlyModuleName} --dev`}</Text> (or <Text code>npm run mix</Text>) and refresh the page to show it on the sidebar.
						</span>
					}
				/>
			</Form>
		</Modal>
	);
}
