import React from 'react';
import { Card, Row, Col, Form, Input } from 'antd';
import { LockOutlined } from '@ant-design/icons';

export interface UserSecurityCardProps {
	isEdit: boolean;
}

export default function UserSecurityCard({ isEdit }: UserSecurityCardProps) {
	return (
		<Card
			title="2. Security & Credentials"
			bordered={false}
			style={{
				borderRadius: 12,
				border: '1px solid #edf0f5',
				marginBottom: 20,
				boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
			}}
		>
			<Row gutter={16}>
				<Col xs={24} md={12}>
					<Form.Item
						name="password"
						label={isEdit ? 'New Password (Optional)' : 'Account Password'}
						rules={[{ min: 6, message: 'Password must be at least 6 characters.' }]}
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
		</Card>
	);
}
