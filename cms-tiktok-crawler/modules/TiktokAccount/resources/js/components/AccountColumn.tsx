import React from 'react';
import { Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export interface AccountColumnProps {
	username: string;
	nickname?: string;
	imgPath?: string;
}

const AccountColumn: React.FC<AccountColumnProps> = ({ username, nickname, imgPath }) => {
	const { Text } = Typography;
	return (
		<Space size="middle" align="center">
			<Avatar size={40} src={imgPath} icon={<UserOutlined />} />
			<Space direction="vertical" size={0}>
				<Text strong>@{username}</Text>
				{nickname && nickname !== username ? (
					<Text type="secondary" style={{ fontSize: 12 }}>
						{nickname}
					</Text>
				) : null}
			</Space>
		</Space>
	);
};

export default AccountColumn;
