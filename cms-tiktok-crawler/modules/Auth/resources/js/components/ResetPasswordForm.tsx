import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined, MailOutlined, CheckCircleOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import { resetPassword, forgotPassword } from '../Action/auth';
import type { ResetPasswordPayload } from '../Action/auth';

export interface ResetPasswordFormProps {
	initialEmail?: string;
	initialToken?: string;
	onBackToLogin: () => void;
}

export default function ResetPasswordForm({ initialEmail = '', initialToken = '', onBackToLogin }: ResetPasswordFormProps) {
	const [form] = Form.useForm();
	const { act, loading } = useAction();
	const [error, setError] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState<boolean>(false);
	const [successDescription, setSuccessDescription] = useState<string>('');

	const hasToken = Boolean(initialToken);

	const handleRequestResetLink = async (values: { email: string }) => {
		setError(null);
		await act(() => forgotPassword(values.email), {
			successMessage: 'Password reset instructions have been generated.',
			onSuccess: () => {
				setIsSuccess(true);
				setSuccessDescription('A password reset request has been processed for your email address.');
			},
			onError: (e) => setError(e?.message || 'Failed to request password reset. Please verify your email.'),
		});
	};

	const handleResetPassword = async (values: { password: string; password_confirmation: string }) => {
		setError(null);
		const payload: ResetPasswordPayload = {
			email: initialEmail,
			token: initialToken,
			password: values.password,
			password_confirmation: values.password_confirmation,
		};

		await act(() => resetPassword(payload), {
			successMessage: 'Password reset successfully! Please sign in with your new password.',
			onSuccess: () => {
				setIsSuccess(true);
				setSuccessDescription('Your password has been changed. You can now log in with your new credentials.');
			},
			onError: (e) => setError(e?.message || 'Failed to reset password. Please verify your reset token.'),
		});
	};

	if (isSuccess) {
		return (
			<div>
				<Alert type="success" showIcon icon={<CheckCircleOutlined style={{ fontSize: 20 }} />} message="Request Completed" description={successDescription} style={{ marginBottom: 24, borderRadius: 8 }} />
				<Button
					type="primary"
					block
					icon={<ArrowLeftOutlined />}
					style={{
						height: 44,
						fontWeight: 600,
						borderRadius: 8,
						background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
					}}
					onClick={onBackToLogin}
				>
					Back to Sign In
				</Button>
			</div>
		);
	}

	return (
		<div>
			{error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20, borderRadius: 8 }} closable onClose={() => setError(null)} />}

			{hasToken ? (
				<Form form={form} layout="vertical" size="large" initialValues={{ email: initialEmail }} onFinish={handleResetPassword}>
					<Form.Item
						name="password"
						label="New Password"
						rules={[
							{ required: true, message: 'Please enter a new password' },
							{ min: 8, message: 'Password must be at least 8 characters' },
						]}
					>
						<Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="New password (min 8 chars)" autoComplete="new-password" />
					</Form.Item>

					<Form.Item
						name="password_confirmation"
						label="Confirm Password"
						dependencies={['password']}
						rules={[
							{ required: true, message: 'Please confirm your new password' },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error('The confirmation password does not match.'));
								},
							}),
						]}
					>
						<Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Repeat new password" autoComplete="new-password" />
					</Form.Item>

					<Form.Item style={{ marginBottom: 16 }}>
						<Button
							type="primary"
							htmlType="submit"
							block
							loading={loading}
							style={{
								height: 44,
								fontWeight: 600,
								borderRadius: 8,
								background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
							}}
						>
							Set New Password
						</Button>
					</Form.Item>
				</Form>
			) : (
				<Form form={form} layout="vertical" size="large" initialValues={{ email: initialEmail }} onFinish={handleRequestResetLink}>
					<Form.Item
						name="email"
						label="Account Email"
						rules={[
							{ required: true, message: 'Please enter your account email' },
							{ type: 'email', message: 'Please enter a valid email address' },
						]}
					>
						<Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="Enter your registered email" autoComplete="email" />
					</Form.Item>

					<Form.Item style={{ marginBottom: 16 }}>
						<Button
							type="primary"
							htmlType="submit"
							block
							loading={loading}
							icon={<SendOutlined />}
							style={{
								height: 44,
								fontWeight: 600,
								borderRadius: 8,
								background: 'linear-gradient(135deg, #EC008C 0%, #6B217F 100%)',
							}}
						>
							Send Reset Instructions
						</Button>
					</Form.Item>
				</Form>
			)}

			<div style={{ textAlign: 'center', marginTop: 16 }}>
				<Button type="link" icon={<ArrowLeftOutlined />} onClick={onBackToLogin} style={{ color: '#64748b', fontSize: 14, padding: 0 }}>
					Back to Sign In
				</Button>
			</div>
		</div>
	);
}
