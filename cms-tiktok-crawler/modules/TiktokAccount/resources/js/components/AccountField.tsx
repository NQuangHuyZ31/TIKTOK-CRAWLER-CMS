import { Form, Input, InputNumber, Row, Col, Checkbox, Space } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

function AccountFields() {
	const form = Form.useFormInstance();
	const username = Form.useWatch('username', form);

	useEffect(() => {
		if (!username) {
			form.setFieldValue('profile_url', '');
			return;
		}

		const cleanUsername = username.replace(/^@/, '').trim();
		form.setFieldValue('profile_url', `https://www.tiktok.com/@${cleanUsername}`);
	}, [username, form]);

	return (
		<>
			<Row gutter={16}>
				<Col xs={24} md={12}>
					<Form.Item
						name="username"
						label="Username"
						rules={[
							{
								required: true,
								message: 'Please enter TikTok username',
							},
						]}
					>
						<Input placeholder="e.g. khaby.lame" />
					</Form.Item>
				</Col>
				<Col xs={24} md={12}>
					<Form.Item name="nickname" label="Nickname / Display Name">
						<Input placeholder="e.g. Khaby Lame" />
					</Form.Item>
				</Col>
			</Row>

			<Form.Item
				name="profile_url"
				label="Profile URL"
				rules={[
					{
						type: 'url',
						message: 'Invalid URL format',
					},
				]}
			>
				<Input placeholder="https://www.tiktok.com/@username" disabled />
			</Form.Item>

			<Form.Item name="bio" label="Bio / Description">
				<TextArea rows={3} placeholder="TikTok account bio or description" maxLength={1000} showCount />
			</Form.Item>

			<Row gutter={16}>
				<Col xs={24} sm={12} md={6}>
					<Form.Item name="followers_count" label="Followers Count" rules={[{ type: 'number', min: 0, message: 'Must be >= 0' }]}>
						<InputNumber style={{ width: '100%' }} placeholder="0" min={0} />
					</Form.Item>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Form.Item name="following_count" label="Following Count" rules={[{ type: 'number', min: 0, message: 'Must be >= 0' }]}>
						<InputNumber style={{ width: '100%' }} placeholder="0" min={0} />
					</Form.Item>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Form.Item name="likes_count" label="Likes Count" rules={[{ type: 'number', min: 0, message: 'Must be >= 0' }]}>
						<InputNumber style={{ width: '100%' }} placeholder="0" min={0} />
					</Form.Item>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Form.Item name="video_count" label="Videos Count" rules={[{ type: 'number', min: 0, message: 'Must be >= 0' }]}>
						<InputNumber style={{ width: '100%' }} placeholder="0" min={0} />
					</Form.Item>
				</Col>
			</Row>

			<Space size="large" style={{ marginBottom: 16 }}>
				<Form.Item name="status" valuePropName="checked" noStyle>
					<Checkbox>Active Status</Checkbox>
				</Form.Item>
				<Form.Item name="is_verified" valuePropName="checked" noStyle>
					<Checkbox>Verified Account</Checkbox>
				</Form.Item>
			</Space>
		</>
	);
}

export default AccountFields;
