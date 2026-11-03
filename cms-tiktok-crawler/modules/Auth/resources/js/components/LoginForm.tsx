import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Alert, Flex, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import { loginThunk, fetchMeThunk } from '../store/auth/authThunks';
import type { LoginPayload } from '../Action/auth';
import GoogleLoginButton from './GoogleLoginButton';

export interface LoginFormProps {
	onSuccess: () => void;
	onRequireEmailOtp: (data: { temp_token: string; email: string }) => void;
	onForgotPassword: () => void;
	onGoogleLoginClick: () => void;
	googleLoading?: boolean;
}

export default function LoginForm({
	onSuccess,
	onRequireEmailOtp,
	onForgotPassword,
	onGoogleLoginClick,
	googleLoading = false,
}: LoginFormProps) {
	const [form] = Form.useForm<LoginPayload>();
	const dispatch = useDispatch();

	const { loading, error } = useSelector((state: { auth: { loading: boolean; error: string | null } }) => state.auth);
	const [localError, setLocalError] = useState<string | null>(null);

	const handleSubmit = async (values: LoginPayload) => {
		setLocalError(null);
		try {
			const resultAction = await dispatch(
				loginThunk({
					email: values.email,
					password: values.password,
				}),
			);

			if (loginThunk.fulfilled.match(resultAction)) {
				const payload = (resultAction.payload as any)?.data ?? resultAction.payload;
				if (payload?.require_otp || payload?.step === 'email_otp') {
					onRequireEmailOtp({
						temp_token: payload.temp_token,
						email: payload.email,
					});
				} else {
					await dispatch(fetchMeThunk());
					onSuccess();
				}
			} else {
				setLocalError((resultAction.payload as string) || 'Invalid email or password.');
			}
		} catch (e: unknown) {
			setLocalError((e as Error)?.message || 'An unexpected error occurred.');
		}
	};

	const displayError = localError || error;

	return (
		<div>
			{displayError && <Alert type="error" showIcon message={displayError} style={{ marginBottom: 20, borderRadius: 8 }} closable onClose={() => setLocalError(null)} />}

			<Form form={form} layout="vertical" size="large" initialValues={{ remember: true }} onFinish={handleSubmit}>
				<Form.Item
					name="email"
					rules={[
						{ required: true, message: 'Please enter your email' },
						{ type: 'email', message: 'Please enter a valid email address' },
					]}
				>
					<Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Email address" autoComplete="email" />
				</Form.Item>

				<Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
					<Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password" autoComplete="current-password" />
				</Form.Item>

				<Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
					<Form.Item name="remember" valuePropName="checked" noStyle>
						<Checkbox>Remember me</Checkbox>
					</Form.Item>
					<Button type="link" onClick={onForgotPassword} style={{ padding: 0, fontSize: 13 }}>
						Forgot password?
					</Button>
				</Flex>

				<Form.Item style={{ marginBottom: 16 }}>
					<Button
						type="primary"
						htmlType="submit"
						block
						loading={loading}
						icon={<LoginOutlined />}
						style={{
							height: 44,
							fontWeight: 600,
							borderRadius: 8,
							background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
						}}
					>
						Sign In
					</Button>
				</Form.Item>

				<Divider plain style={{ margin: '16px 0', color: '#94a3b8', fontSize: 12 }}>
					or continue with
				</Divider>

				<GoogleLoginButton loading={googleLoading} onClick={onGoogleLoginClick} />
			</Form>
		</div>
	);
}
