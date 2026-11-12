import React from 'react';
import { Card, Row, Col, Form, Input, Radio, Alert, theme } from 'antd';
import { LockOutlined, GoogleOutlined, MailOutlined } from '@ant-design/icons';

export interface UserSecurityCardProps {
	isEdit: boolean;
}

export default function UserSecurityCard({ isEdit }: UserSecurityCardProps) {
	const { token } = theme.useToken();
	const form = Form.useFormInstance();
	const authType = Form.useWatch('auth_type', form) || 'password';

	return (
		<Card
			title="2. Security & Credentials"
			bordered={false}
			style={{
				borderRadius: 12,
				border: `1px solid ${token.colorBorderSecondary}`,
				marginBottom: 20,
				boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
			}}
		>
			{!isEdit && (
				<Form.Item name="auth_type" label="Login Method" style={{ marginBottom: 16 }}>
					<Radio.Group
						optionType="button"
						buttonStyle="solid"
						onChange={(e) => {
							if (e.target.value === 'google') {
								form.setFieldsValue({ password: '', password_confirmation: '' });
							}
						}}
					>
						<Radio.Button value="password">
							<MailOutlined /> Email & Password
						</Radio.Button>
						<Radio.Button value="google">
							<GoogleOutlined /> Google OAuth
						</Radio.Button>
					</Radio.Group>
				</Form.Item>
			)}

			{!isEdit && authType === 'google' ? (
				<Alert
					type="info"
					showIcon
					icon={<GoogleOutlined />}
					message="Google Sign-In Account"
					description="This user will authenticate via Google OAuth. Password login and email password reset are disabled for this account."
					style={{ borderRadius: 8 }}
				/>
			) : (
				<Row gutter={16}>
					<Col xs={24} md={12}>
						<Form.Item
							name="password"
							label={isEdit ? 'New Password (Optional)' : 'Account Password'}
							rules={[
								...(!isEdit ? [{ required: true, message: 'Please enter an account password.' }] : []),
								{ min: 6, message: 'Password must be at least 6 characters.' },
							]}
							extra={isEdit ? 'Leave empty to keep existing password.' : 'Minimum 6 characters.'}
						>
							<Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder={isEdit ? '••••••••' : 'Enter strong password'} />
						</Form.Item>
					</Col>

					<Col xs={24} md={12}>
						<Form.Item
							name="password_confirmation"
							label={isEdit ? 'Confirm New Password' : 'Confirm Password'}
							dependencies={['password']}
							rules={[
								...(!isEdit ? [{ required: true, message: 'Please confirm the password.' }] : []),
								({ getFieldValue }) => ({
									validator(_, value) {
										if (!value || getFieldValue('password') === value) {
											return Promise.resolve();
										}
										return Promise.reject(new Error('The two passwords do not match.'));
									},
								}),
							]}
						>
							<Input.Password prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} placeholder="Repeat password" />
						</Form.Item>
					</Col>
				</Row>
			)}
		</Card>
	);
}
