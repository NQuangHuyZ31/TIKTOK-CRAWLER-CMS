import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined, MailOutlined, KeyOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import { resetPassword } from '../Action/auth';

interface ResetPasswordFormProps {
	initialEmail?: string;
	initialToken?: string;
	onBackToLogin: () => void;
}

export default function ResetPasswordForm({ initialEmail = '', initialToken = '', onBackToLogin }: ResetPasswordFormProps) {
	const [form] = Form.useForm();
	const { act, loading } = useAction();
	const [error, setError] = useState<string | null>(null);
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubmit = async (values: any) => {
		setError(null);
		await act(
			() =>
				resetPassword({
					email: initialEmail,
					token: initialToken,
					password: values.password,
					password_confirmation: values.password_confirmation,
				}),
			{
				successMessage: 'Password reset successfully! Please sign in with your new password.',
				onSuccess: () => setIsSuccess(true),
				onError: (e) => setError(e?.message || 'Failed to reset password. Please verify your token.'),
			}
		);
	};

	if (isSuccess) {
		return (
			<div>
				<Alert
					type="success"
					showIcon
					icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
					message="Password Reset Successful"
					description="Your password has been changed. You can now log in with your new credentials."
					style={{ marginBottom: 24, borderRadius: 8 }}
				/>
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

			<Form
				form={form}
				layout="vertical"
				size="large"
				initialValues={{
					email: initialEmail,
					token: initialToken,
				}}
				onFinish={handleSubmit}
			>
				<Form.Item
					name="password"
					label="New Password"
					rules={[
						{ required: true, message: 'Please enter a new password' },
						{ min: 6, message: 'Password must be at least 6 characters' },
					]}
				>
					<Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="New password (min 6 chars)" autoComplete="new-password" />
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
						Reset Password
					</Button>
				</Form.Item>
			</Form>

			<div style={{ textAlign: 'center', marginTop: 16 }}>
				<Button type="link" icon={<ArrowLeftOutlined />} onClick={onBackToLogin} style={{ color: '#64748b', fontSize: 14, padding: 0 }}>
					Back to Sign In
				</Button>
			</div>
		</div>
	);
}
