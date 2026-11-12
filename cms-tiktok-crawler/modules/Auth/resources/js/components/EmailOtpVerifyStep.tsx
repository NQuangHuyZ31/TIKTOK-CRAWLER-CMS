import React, { useState } from 'react';
import { Button, Flex, Typography, message } from 'antd';
import { MailOutlined, ReloadOutlined } from '@ant-design/icons';
import { resendEmailOtp } from '../Action/auth';
import OtpVerificationForm from './OtpVerificationForm';

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
	const [resending, setResending] = useState<boolean>(false);

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

	const header = (
		<div style={{ textAlign: 'center', marginBottom: 20 }}>
			<div style={{ padding: '8px 0' }}>
				<MailOutlined style={{ fontSize: 44, color: '#EC008C', marginBottom: 8 }} />
				<Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 4px' }}>
					We sent a 6-digit verification code to
				</Paragraph>
				<Text strong style={{ fontSize: 14, color: '#0f172a' }}>
					{email}
				</Text>
			</div>
		</div>
	);

	const extraActions = (
		<Flex justify="center" style={{ margin: '4px 0' }}>
			<Button type="link" size="small" icon={<ReloadOutlined />} loading={resending} disabled={loading} onClick={handleResend} style={{ fontSize: 13 }}>
				Resend Code
			</Button>
		</Flex>
	);

	return <OtpVerificationForm loading={loading} error={error} header={header} extraActions={extraActions} onVerify={onVerify} onBack={onBack} />;
}
