import React from 'react';
import { Card, Avatar, Typography, Space, Tag, theme } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, KeyOutlined } from '@ant-design/icons';
import StatusTag from '@core/components/StatusTag';
import { formatDateTime } from '@core/utils/formatDate';
import type { UserItem } from '../../Action/user';
import type { RoleBadgeConfig } from '../../configs/userConstants';

const { Title, Text } = Typography;

export interface UserProfileOverviewCardProps {
	user: UserItem;
	roleCfg: RoleBadgeConfig;
}

export default function UserProfileOverviewCard({ user, roleCfg }: UserProfileOverviewCardProps) {
	const { token } = theme.useToken();

	return (
		<Card
			style={{
				borderRadius: 12,
				border: `1px solid ${token.colorBorderSecondary}`,
				marginBottom: 20,
				boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
			}}
		>
			<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
				{user.avatar_url ? (
					<Avatar src={user.avatar_url} size={72} />
				) : (
					<Avatar
						size={72}
						style={{
							backgroundColor: roleCfg.color,
							fontWeight: 700,
							fontSize: 24,
						}}
					>
						{(user.name.slice(0, 2) || 'U').toUpperCase()}
					</Avatar>
				)}

				<div style={{ flex: 1, minWidth: 200 }}>
					<Space size={10} align="center">
						<Title level={3} style={{ margin: 0, fontWeight: 700 }}>
							{user.name}
						</Title>
						<StatusTag status={user.status} />
						{user.permission_type === 'user' ? (
							<Tag
								icon={<KeyOutlined />}
								color="purple"
								style={{
									fontWeight: 600,
									padding: '2px 8px',
								}}
							>
								Direct Permissions
							</Tag>
						) : (
							<Tag
								icon={user.is_admin ? <CrownOutlined /> : <SafetyCertificateOutlined />}
								style={{
									color: roleCfg.color,
									background: roleCfg.bg,
									borderColor: roleCfg.border,
									fontWeight: 600,
									padding: '2px 8px',
								}}
							>
								{roleCfg.name}
							</Tag>
						)}
					</Space>
					<div style={{ marginTop: 6 }}>
						<Space size={16} wrap>
							<Text type="secondary">
								<MailOutlined style={{ marginRight: 6 }} />
								{user.email}
							</Text>
							{user.phone && (
								<Text type="secondary">
									<PhoneOutlined style={{ marginRight: 6 }} />
									{user.phone}
								</Text>
							)}
							<Text type="secondary">
								<CalendarOutlined style={{ marginRight: 6 }} />
								Joined: {formatDateTime(user.created_at)}
							</Text>
						</Space>
					</div>
				</div>
			</div>
		</Card>
	);
}
