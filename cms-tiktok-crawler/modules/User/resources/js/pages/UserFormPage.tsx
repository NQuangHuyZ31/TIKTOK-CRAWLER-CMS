import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Space, Typography, Row, Col, Divider, Alert, Spin, Result, Flex, Radio } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, LinkOutlined, SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import useAction from '@core/hooks/useAction';
import PageHeader from '@core/components/PageHeader';
import { USER_FORM_STATUS_OPTIONS } from '../configs/userConstants';
import { fetchUserDetail, fetchRolesAndPermissions } from '../store/user/userThunks';
import userAPI from '../Action/user';
import RoleSelector from '../components/RoleSelector';
import PermissionMatrixSelector from '../components/PermissionMatrixSelector';
import AccessDeny from '@core/components/AccessDeny';

const { Title, Text, Paragraph } = Typography;

export default function UserFormPage() {
	const { id: rawId } = useParams<{ id: string }>();
	const id = rawId && rawId.toLowerCase() !== 'create' ? rawId : undefined;
	const isEdit = Boolean(id);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [form] = Form.useForm();
	const { act, loading: submitting } = useAction();

	const [formError, setFormError] = useState<string | null>(null);

	const { currentUser: user, detailLoading, rolesCatalog, permissionsCatalog, groupedPermissionsCatalog, error } = useSelector((state) => state.user);

	// Watch permission type & selected role
	const permissionType = Form.useWatch('permission_type', form) || 'role';
	const selectedRoles = Form.useWatch('roles', form) || [];
	const isAdmin = permissionType === 'role' && selectedRoles.includes('admin');

	useEffect(() => {
		dispatch(fetchRolesAndPermissions());
		if (isEdit && id) {
			dispatch(fetchUserDetail(id));
		} else {
			form.resetFields();
			form.setFieldsValue({
				status: 'active',
				permission_type: 'role',
				roles: ['editor'],
				permissions: [],
			});
		}
	}, [dispatch, isEdit, id, form]);

	useEffect(() => {
		if (isEdit && user) {
			const isDirectUser = user.permission_type === 'user' || (user.permissions && user.permissions.length > 0 && (!user.roles || user.roles.length === 0));
			form.setFieldsValue({
				name: user.name,
				email: user.email,
				phone: user.phone,
				avatar: user.avatar,
				status: user.status,
				permission_type: isDirectUser ? 'user' : 'role',
				roles: isDirectUser ? [] : (user.role_slugs || (user.roles?.map((r) => r.slug) ?? ['editor'])),
				permissions: isDirectUser ? (user.permissions?.map((p: any) => typeof p === 'string' ? p : p.slug) || user.all_permissions || []) : [],
			});
		}
	}, [isEdit, user, form]);

	const handleSubmit = async (values: any) => {
		setFormError(null);

		const isRoleMode = values.permission_type === 'role';
		const payload: Record<string, any> = {
			name: values.name,
			email: values.email,
			phone: values.phone || null,
			avatar: values.avatar || null,
			status: values.status,
			permission_type: values.permission_type || 'role',
			roles: isRoleMode ? (Array.isArray(values.roles) ? values.roles : [values.roles]) : [],
			permissions: !isRoleMode ? (values.permissions || []) : [],
		};

		if (values.password) {
			payload.password = values.password;
		}

		await act(
			() => (isEdit && id ? userAPI.updateUser(id, payload) : userAPI.createUser(payload)),
			{
				successMessage: isEdit ? 'User account updated successfully' : 'User account created successfully',
				errorMessage: 'Failed to save user account. Please check your permissions.',
				onSuccess: () => navigate('/user'),
				onError: (err) => setFormError(err?.response?.data?.message || err?.message),
			}
		);
	};

	if (isEdit && error && (error.includes('Forbidden') || error.includes('403'))) {
		return <AccessDeny />;
	}

	if (isEdit && detailLoading) {
		return (
			<div style={{ padding: 40, textAlign: 'center' }}>
				<Spin size="large" tip="Loading user data..." />
			</div>
		);
	}

	return (
		<div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
			{/* Standardized PageHeader matching all modules */}
			<PageHeader
				title={isEdit ? `Edit User: ${user?.name || ''}` : 'Create New User Account'}
				subtitle={isEdit ? 'Update user account information, assign roles, and adjust module permissions.' : 'Register a new CMS user, assign system role, and configure permissions.'}
				onBack={() => navigate('/user')}
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Users', href: '/admin/user' }, { title: isEdit ? 'Edit User' : 'Create User' }]}
				extra={
					<Space wrap>
						<Button onClick={() => navigate('/user')} disabled={submitting}>
							Cancel
						</Button>
						<Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={() => form.submit()}>
							{isEdit ? 'Save Changes' : 'Create User'}
						</Button>
					</Space>
				}
			/>

			{formError && <Alert type="error" showIcon message="Action Failed" description={formError} style={{ marginBottom: 20, borderRadius: 8 }} />}

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					status: 'active',
					permission_type: 'role',
					roles: ['editor'],
				}}
				requiredMark="optional"
			>
				{/* 1. Basic Information */}
				<Card
					title="1. Basic Profile Information"
					bordered={false}
					style={{
						borderRadius: 12,
						border: '1px solid #edf0f5',
						marginBottom: 20,
						boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
					}}
				>
					<Row gutter={16}>
						<Col xs={24} md={12}>
							<Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter the user full name.' }]}>
								<Input prefix={<UserOutlined style={{ color: '#8c8c8c' }} />} placeholder="e.g. Alex Johnson" />
							</Form.Item>
						</Col>

						<Col xs={24} md={12}>
							<Form.Item
								name="email"
								label="Email Address"
								rules={[
									{ required: true, message: 'Please enter email address.' },
									{ type: 'email', message: 'Please enter a valid email.' },
								]}
							>
								<Input prefix={<MailOutlined style={{ color: '#8c8c8c' }} />} placeholder="alex@company.com" />
							</Form.Item>
						</Col>

						<Col xs={24} md={12}>
							<Form.Item name="phone" label="Phone Number">
								<Input prefix={<PhoneOutlined style={{ color: '#8c8c8c' }} />} placeholder="0912345678" />
							</Form.Item>
						</Col>

						<Col xs={24} md={12}>
							<Form.Item name="status" label="Account Status" rules={[{ required: true, message: 'Please select account status.' }]}>
								<Select options={USER_FORM_STATUS_OPTIONS} />
							</Form.Item>
						</Col>

						<Col xs={24}>
							<Form.Item name="avatar" label="Avatar Image URL (Optional)">
								<Input prefix={<LinkOutlined style={{ color: '#8c8c8c' }} />} placeholder="https://..." />
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* 2. Security & Credentials */}
				<Card
					title="2. Security & Credentials"
					bordered={false}
					style={{
						borderRadius: 12,
						border: '1px solid #edf0f5',
						marginBottom: 20,
						boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
					}}
				>
					<Row gutter={16}>
						<Col xs={24} md={12}>
							<Form.Item
								name="password"
								label={isEdit ? 'New Password (Optional)' : 'Account Password'}
								rules={[
									{ required: !isEdit, message: 'Please enter account password.' },
									{ min: 6, message: 'Password must be at least 6 characters.' },
								]}
								extra={isEdit ? 'Leave empty to keep existing password.' : 'Minimum 6 characters.'}
							>
								<Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder={isEdit ? '••••••••' : 'Enter strong password'} />
							</Form.Item>
						</Col>

						<Col xs={24} md={12}>
							<Form.Item
								name="password_confirmation"
								label={isEdit ? 'Confirm New Password' : 'Confirm Password'}
								dependencies={['password']}
								rules={[
									{ required: !isEdit, message: 'Please confirm account password.' },
									({ getFieldValue }) => ({
										validator(_, value) {
											if (!value || getFieldValue('password') === value) {
												return Promise.resolve();
											}
											return Promise.reject(new Error('The two passwords do not match.'));
										},
									}),
								]}
							>
								<Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="Repeat password" />
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* 3. Access Privileges & Permission Mechanism (Mutually Exclusive: Role or Direct User) */}
				<Card
					title="3. Access Privileges & Permission Mechanism"
					bordered={false}
					style={{
						borderRadius: 12,
						border: '1px solid #edf0f5',
						marginBottom: 20,
						boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
					}}
				>
					<Form.Item
						name="permission_type"
						label="Authorization Mode (Choose one mutually exclusive mode)"
						rules={[{ required: true, message: 'Please select an authorization mode.' }]}
						extra="Select an independent authorization model: Role-based permissions or Direct User permissions. These two mechanisms are strictly mutually exclusive and never merged."
					>
						<Radio.Group
							buttonStyle="solid"
							size="middle"
							onChange={(e) => {
								const nextType = e.target.value;
								if (nextType === 'role') {
									form.setFieldsValue({
										permission_type: 'role',
										permissions: [],
										roles: form.getFieldValue('roles')?.length > 0 ? form.getFieldValue('roles') : ['editor'],
									});
								} else {
									form.setFieldsValue({
										permission_type: 'user',
										roles: [],
									});
								}
							}}
						>
							<Radio.Button value="role" style={{ padding: '0 18px', height: 40, lineHeight: '38px' }}>
								<Space>
									<SafetyCertificateOutlined />
									<span>Role-based Permissions</span>
								</Space>
							</Radio.Button>
							<Radio.Button value="user" style={{ padding: '0 18px', height: 40, lineHeight: '38px' }}>
								<Space>
									<KeyOutlined />
									<span>Direct User Permissions</span>
								</Space>
							</Radio.Button>
						</Radio.Group>
					</Form.Item>

					<Divider style={{ margin: '16px 0 24px' }} />

					{permissionType === 'role' ? (
						<div>
							<Alert
								type="info"
								showIcon
								message="Mode: Role-based Authorization"
								description="This user inherits all access privileges granted by the assigned system role. Individual custom permissions do not apply."
								style={{ marginBottom: 20, borderRadius: 8 }}
							/>
							<Form.Item
								name="roles"
								label="Assign System Role"
								rules={[{ required: true, message: 'Please select a system role.' }]}
							>
								<RoleSelector availableRoles={rolesCatalog} />
							</Form.Item>
						</div>
					) : (
						<div>
							<Alert
								type="warning"
								showIcon
								message="Mode: Direct User Authorization"
								description="This user does not belong to any fixed role. All privileges (View/Create/Edit/Delete) are configured directly per module below."
								style={{ marginBottom: 20, borderRadius: 8 }}
							/>
							<Form.Item
								name="permissions"
								label="Direct Module Privileges Configuration"
								extra="Select specific granular privileges this user is allowed to perform for each module."
							>
								<PermissionMatrixSelector isAdmin={false} />
							</Form.Item>
						</div>
					)}
				</Card>
			</Form>
		</div>
	);
}
