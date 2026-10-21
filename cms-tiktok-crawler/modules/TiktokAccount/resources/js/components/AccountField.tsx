import { Form, Input, InputNumber, Space, Checkbox } from "antd";
import { useEffect } from "react";

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
			<Form.Item
				name="username"
				label="Username"
				rules={[
					{
						required: true,
						message: 'Vui lòng nhập username',
					},
				]}
			>
				<Input placeholder="Nhập username TikTok" />
			</Form.Item>

			<Form.Item
				name="profile_url"
				label="Profile URL"
				rules={[
					{
						type: 'url',
						message: 'URL không hợp lệ',
					},
				]}
			>
				<Input
					placeholder="https://www.tiktok.com/@username"
					disabled
				/>
			</Form.Item>

			<Space orientation="horizontal">
				<Form.Item
					name="following_count"
					label="Followings Count"
					rules={[
						{
							required: true,
							type: 'number',
							min: 0,
							message:
								'Vui lòng nhập số lượng đang theo dõi',
						},
					]}
				>
					<InputNumber
						placeholder="Nhập số lượng đang theo dõi"
						min={0}
					/>
				</Form.Item>

				<Form.Item
					name="followers_count"
					label="Followers Count"
					rules={[
						{
							required: true,
							type: 'number',
							min: 0,
							message:
								'Vui lòng nhập số lượng người theo dõi',
						},
					]}
				>
					<InputNumber
						placeholder="Nhập số lượng người theo dõi"
						min={0}
					/>
				</Form.Item>

				<Form.Item
					name="likes_count"
					label="Likes Count"
					rules={[
						{
							required: true,
							type: 'number',
							min: 0,
							message:
								'Vui lòng nhập số lượng like',
						},
					]}
				>
					<InputNumber
						placeholder="Nhập số lượng like"
						min={0}
					/>
				</Form.Item>
			</Space>

			<Form.Item
				name="status"
				label="Status"
				valuePropName="checked"
			>
				<Checkbox>Active</Checkbox>
			</Form.Item>
		</>
	);
}

export default AccountFields;