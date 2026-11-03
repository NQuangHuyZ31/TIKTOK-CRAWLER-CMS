import React, { useState } from 'react';
import { Alert, Button, Flex, Input, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { resendEmailOtp } from '../Action/auth';

const { Text, Paragraph } = Typography;

export interface EmailOtpVerifyStepProps {
	tempToken: string;
	email: string;
	loading: boolean;
	error: string | null;
	onVerify: (otp: string) => void;
	onBack: () => void;
}

export default function EmailOtpVerifyStep({ tempToken, email, loading, error, onVerify, onBack }: EmailOtpVerifyStepProps) {
	const [otp, setOtp] = useState<string>('');
	const [resending, setResending] = useState<boolean>(false);

	const handleComplete = (value: string) => {
		setOtp(value);
		if (value.length === 6 && !loading) {
			onVerify(value);
		}
	};

	const handleManualSubmit = () => {
		if (otp.length === 6 && !loading) {
			onVerify(otp);
		}
	};

	const handleResend = async () => {
		if (resending || loading) return;
		setResending(true);
		try {
			await resendEmailOtp(tempToken);
			message.success('A new verification code has been sent to your email.');
		} catch (err: any) {
			message.error(err?.message || 'Failed to resend verification code. Please try again.');
		} finally {
			setResending(false);
		}
	};

	return (
		<div>
			{error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 8 }} />}

			<div style={{ textAlign: 'center', marginBottom: 20 }}>
				<div style={{ padding: '8px 0' }}>
					<MailOutlined style={{ fontSize: 44, color: '#1677ff', marginBottom: 8 }} />
					<Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 4px' }}>
						We sent a 6-digit verification code to
					</Paragraph>
					<Text strong style={{ fontSize: 14, color: '#0f172a' }}>
						{email}
					</Text>
				</div>
			</div>

			<div style={{ textAlign: 'center', marginBottom: 24 }}>
				<Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
					Verification Code
				</Text>
				<Flex justify="center">
					<Input.OTP size="large" length={6} value={otp} onChange={handleComplete} disabled={loading} autoFocus />
				</Flex>
			</div>

			<Space direction="vertical" size={10} style={{ width: '100%' }}>
				<Button
					type="primary"
					block
					size="large"
					loading={loading}
					disabled={otp.length !== 6 || loading}
					onClick={handleManualSubmit}
					style={{
						height: 44,
						fontWeight: 600,
						borderRadius: 8,
						background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
					}}
				>
					Verify & Sign In
				</Button>

				<Flex justify="center" style={{ margin: '4px 0' }}>
					<Button type="link" size="small" icon={<ReloadOutlined />} loading={resending} disabled={loading} onClick={handleResend} style={{ fontSize: 13 }}>
						Resend Code
					</Button>
				</Flex>

				<Button type="link" block icon={<ArrowLeftOutlined />} onClick={onBack} disabled={loading} style={{ fontSize: 13, color: '#64748b' }}>
					Back to Login
				</Button>
			</Space>
		</div>
	);
}
