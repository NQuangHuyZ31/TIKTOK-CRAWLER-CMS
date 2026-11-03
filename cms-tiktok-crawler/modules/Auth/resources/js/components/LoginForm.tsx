import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Alert, Flex, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { loginThunk } from '../store/auth/authThunks';
import { AUTH_ROUTES } from '../configs/authConfig';
import type { TwoFactorChallengeData } from '../Action/auth';
import GoogleLoginButton from './GoogleLoginButton';

export interface LoginFormProps {
	onRequire2FA: (challenge: TwoFactorChallengeData) => void;
	onForgotPassword: () => void;
	onGoogleLoginClick: () => void;
	googleLoading?: boolean;
}

export default function LoginForm({
	onRequire2FA,
	onForgotPassword,
	onGoogleLoginClick,
	googleLoading,
}: LoginFormProps) {
	const [form] = Form.useForm();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const { loading, error } = useSelector((state: any) => state.auth);
	const [localError, setLocalError] = useState<string | null>(null);

	const from = (location.state as any)?.from?.pathname || AUTH_ROUTES.DEFAULT_REDIRECT;

	const handleSubmit = async (values: any) => {
		setLocalError(null);
		try {
			const resultAction = await dispatch(
				loginThunk({
					email: values.email,
					password: values.password,
				})
			);

			if (loginThunk.fulfilled.match(resultAction)) {
				const payload = resultAction.payload as any;
				if (payload?.require_2fa) {
					onRequire2FA(payload as TwoFactorChallengeData);
				} else {
					navigate(from, { replace: true });
				}
			} else {
				setLocalError((resultAction.payload as string) || 'Invalid email or password.');
			}
		} catch (e: any) {
			setLocalError(e.message || 'An unexpected error occurred.');
		}
	};

	return (
		<div>
			{(localError || error) && (
				<Alert
					type="error"
					showIcon
					message={localError || error}
					style={{ marginBottom: 20, borderRadius: 8 }}
					closable
					onClose={() => setLocalError(null)}
				/>
			)}

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
