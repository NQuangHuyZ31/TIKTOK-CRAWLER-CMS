import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Flex, Popconfirm, Space, Tag, Typography } from 'antd';
import {
	CheckCircleFilled,
	DeleteOutlined,
	EditOutlined,
	LinkOutlined,
	ReloadOutlined,
	UserOutlined,
} from '@ant-design/icons';
import PermissionGate from '@core/components/PermissionGate';
import StatusTag from '@core/components/StatusTag';

const { Title, Text, Paragraph } = Typography;

interface AccountDetailHeaderProps {
	account: any;
	deleting: boolean;
	onDelete: () => void;
}

export default function AccountDetailHeader({ account, deleting, onDelete }: AccountDetailHeaderProps) {
	const navigate = useNavigate();

	return (
		<Card styles={{ body: { padding: '20px 24px' } }}>
			<Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
				<Space orientation="horizontal" size={20} align="center" style={{ flex: 1, minWidth: 280 }}>
					<Avatar
						size={84}
						src={account?.avatar_path || undefined}
						icon={!account?.avatar_path ? <UserOutlined /> : undefined}
						style={{ border: '2px solid #e5e7eb', flexShrink: 0 }}
					/>
					<Space direction="vertical" size={4} style={{ width: '100%' }}>
						<Flex align="center" gap={8} wrap="wrap">
							<Title level={4} style={{ margin: 0 }}>
								{account?.nickname || account?.username || '-'}
							</Title>
							{account?.is_verified ? (
								<Tag icon={<CheckCircleFilled />} color="blue" style={{ margin: 0 }}>
									Đã xác minh
								</Tag>
							) : null}
							<StatusTag status={account?.status} />
						</Flex>
						<Text type="secondary" strong style={{ fontSize: 14 }}>
							@{account?.username || '-'}
						</Text>
						{account?.bio && (
							<Paragraph
								ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}
								style={{ margin: '4px 0 0', maxWidth: 650, color: '#4b5563' }}
							>
								{account.bio}
							</Paragraph>
						)}
					</Space>
				</Space>

				<Space size={8} wrap align="center">
					{account?.profile_url && (
						<Button
							icon={<LinkOutlined />}
							href={account.profile_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Xem trên TikTok
						</Button>
					)}

					<PermissionGate module="crawler" action="create">
						<Button
							type="primary"
							icon={<ReloadOutlined />}
							onClick={() => navigate('/crawler/crawl-job/create')}
						>
							Tạo Crawl Job
						</Button>
					</PermissionGate>

					<PermissionGate module="tiktok_account" action="edit">
						<Button
							icon={<EditOutlined />}
							onClick={() => navigate(`/tiktok-account/${account?.id}/edit`)}
						>
							Sửa tài khoản
						</Button>
					</PermissionGate>

					<PermissionGate module="tiktok_account" action="delete">
						<Popconfirm
							title="Xoá tài khoản TikTok"
							description={`Bạn có chắc chắn muốn xoá tài khoản @${account?.username}?`}
							onConfirm={onDelete}
							okText="Xoá"
							cancelText="Huỷ"
							okButtonProps={{ danger: true, loading: deleting }}
						>
							<Button danger icon={<DeleteOutlined />} loading={deleting}>
								Xoá
							</Button>
						</Popconfirm>
					</PermissionGate>
				</Space>
			</Flex>
		</Card>
	);
}
