import { Avatar, Space, Typography } from "antd"
import { UserOutlined } from "@ant-design/icons"

const AccountColumn = ({ username, imgPath }) => {
	const { Text } = Typography;
	return (
		<Space size="middle">
			<Avatar size={40} src={imgPath} icon={<UserOutlined />} />
			<Space orientation="vertical" size={0}>
				<Text strong>@{username}</Text>
				<Text type="secondary">{username}</Text>
			</Space>
		</Space>
	)
}

export default AccountColumn;