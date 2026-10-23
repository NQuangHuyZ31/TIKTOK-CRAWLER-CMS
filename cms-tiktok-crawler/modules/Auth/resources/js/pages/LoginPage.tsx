import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Alert, Flex } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { loginThunk } from '../store/auth/authThunks';
import { AUTH_ROUTES } from '../configs/authConfig';

const { Title, Text } = Typography;

export default function LoginPage() {
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
				}),
			);

			if (loginThunk.fulfilled.match(resultAction)) {
				navigate(from, { replace: true });
			} else {
				setLocalError((resultAction.payload as string) || 'Invalid email or password.');
			}
		} catch (e: any) {
			setLocalError(e.message || 'An unexpected error occurred.');
		}
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'linear-gradient(135deg, #0b1120 0%, #172554 50%, #1e1b4b 100%)',
				padding: '24px',
			}}
		>
			<Card
				style={{
					width: '100%',
					maxWidth: 440,
					borderRadius: 16,
					boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					backdropFilter: 'blur(10px)',
					background: '#ffffff',
				}}
				styles={{ body: { padding: '36px 32px' } }}
			>
				<div style={{ textAlign: 'center', marginBottom: 28 }}>
					<div
						style={{
							width: 56,
							height: 56,
							borderRadius: 14,
							background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 16,
							boxShadow: '0 8px 16px rgba(22, 119, 255, 0.35)',
						}}
					>
						<SafetyCertificateOutlined style={{ fontSize: 28, color: '#ffffff' }} />
					</div>
					<Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
						TikTok Crawler CMS
					</Title>
					<Text type="secondary" style={{ fontSize: 14 }}>
						Sign in to manage crawlers, accounts, and reports
					</Text>
				</div>

				{(localError || error) && <Alert type="error" showIcon message={localError || error} style={{ marginBottom: 20, borderRadius: 8 }} closable onClose={() => setLocalError(null)} />}

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
				</Form>
			</Card>
		</div>
	);
}
