import React, { useState } from 'react';
import { Alert, Button, Flex, Input, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface OtpVerificationFormProps {
	loading: boolean;
	error: string | null;
	header: React.ReactNode;
	extraActions?: React.ReactNode;
	codeLabel?: string;
	onVerify: (otp: string) => void;
	onBack: () => void;
}

export default function OtpVerificationForm({ loading, error, header, extraActions, codeLabel = 'Verification Code', onVerify, onBack }: OtpVerificationFormProps) {
	const [otp, setOtp] = useState<string>('');

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

	return (
		<div>
			{error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16, borderRadius: 8 }} />}

			{header}

			<div style={{ textAlign: 'center', marginBottom: 24 }}>
				<Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
					{codeLabel}
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
						background: 'linear-gradient(135deg, #EC008C 0%, #6B217F 100%)',
					}}
				>
					Verify & Sign In
				</Button>

				{extraActions}

				<Button type="link" block icon={<ArrowLeftOutlined />} onClick={onBack} disabled={loading} style={{ fontSize: 13, color: '#64748b' }}>
					Back to Login
				</Button>
			</Space>
		</div>
	);
}
