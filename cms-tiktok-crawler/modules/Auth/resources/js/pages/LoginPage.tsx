import React, { useEffect } from 'react';
import { Card, Typography } from 'antd';
import { SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import ResetPasswordForm from '../components/ResetPasswordForm';

const { Title, Text } = Typography;

export default function LoginPage() {
	const [searchParams, setSearchParams] = useSearchParams();

	const resetParam = searchParams.get('reset-password') ?? searchParams.get('reset_password');
	const isResetMode = resetParam === '1' || searchParams.has('reset-password') || searchParams.has('reset_password');

	const emailParam = searchParams.get('email') || '';
	const tokenParam = searchParams.get('token') || '';

	useEffect(() => {
		document.title = isResetMode ? 'Reset Password - TikTok Crawler CMS' : 'Sign In - TikTok Crawler CMS';
	}, [isResetMode]);

	const handleBackToLogin = () => {
		setSearchParams({}, { replace: true });
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
							background: isResetMode ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 16,
							boxShadow: isResetMode ? '0 8px 16px rgba(16, 185, 129, 0.3)' : '0 8px 16px rgba(22, 119, 255, 0.35)',
							transition: 'all 0.3s ease',
						}}
					>
						{isResetMode ? <LockOutlined style={{ fontSize: 26, color: '#ffffff' }} /> : <SafetyCertificateOutlined style={{ fontSize: 28, color: '#ffffff' }} />}
					</div>
					<Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
						{isResetMode ? 'Set New Password' : 'TikTok Crawler CMS'}
					</Title>
					<Text type="secondary" style={{ fontSize: 14 }}>
						{isResetMode ? 'Create a strong and secure new password' : 'Sign in to manage crawlers, accounts, and reports'}
					</Text>
				</div>

				{isResetMode ? <ResetPasswordForm initialEmail={emailParam} initialToken={tokenParam} onBackToLogin={handleBackToLogin} /> : <LoginForm />}
			</Card>
		</div>
	);
}
