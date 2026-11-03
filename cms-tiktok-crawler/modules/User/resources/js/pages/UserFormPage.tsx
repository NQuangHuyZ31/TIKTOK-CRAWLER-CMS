import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Space, Alert, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import useAction from '@core/hooks/useAction';
import PageHeader from '@core/components/PageHeader';
import AccessDeny from '@core/components/AccessDeny';
import { fetchUserDetail, fetchRolesAndPermissions } from '../store/user/userThunks';
import userAPI from '../Action/user';
import UserProfileCard from '../components/userForm/UserProfileCard';
import UserSecurityCard from '../components/userForm/UserSecurityCard';
import UserPermissionsCard from '../components/userForm/UserPermissionsCard';

export default function UserFormPage() {
	const { id: rawId } = useParams<{ id: string }>();
	const id = rawId && rawId.toLowerCase() !== 'create' ? rawId : undefined;
	const isEdit = Boolean(id);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [form] = Form.useForm();
	const { act, loading: submitting } = useAction();

	const [formError, setFormError] = useState<string | null>(null);

	const { currentUser: user, detailLoading, rolesCatalog, error } = useSelector((state) => state.user);

	const permissionType = Form.useWatch('permission_type', form) || 'role';

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
				roles: isDirectUser ? [] : user.role_slugs || (user.roles?.map((r) => r.slug) ?? ['editor']),
				permissions: isDirectUser ? user.permissions?.map((p: any) => (typeof p === 'string' ? p : p.slug)) || user.all_permissions || [] : [],
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
			permissions: !isRoleMode ? values.permissions || [] : [],
		};

		if (values.password) {
			payload.password = values.password;
		}

		await act(() => (isEdit && id ? userAPI.updateUser(id, payload) : userAPI.createUser(payload)), {
			successMessage: isEdit ? 'User account updated successfully' : 'User account created successfully',
			errorMessage: 'Failed to save user account. Please check your permissions.',
			onSuccess: () => navigate('/user'),
			onError: (err) => setFormError(err?.response?.data?.message || err?.message),
		});
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
				<UserProfileCard />
				{!isEdit && <UserSecurityCard isEdit={isEdit} />}
				<UserPermissionsCard form={form} permissionType={permissionType} rolesCatalog={rolesCatalog} />
			</Form>
		</div>
	);
}
