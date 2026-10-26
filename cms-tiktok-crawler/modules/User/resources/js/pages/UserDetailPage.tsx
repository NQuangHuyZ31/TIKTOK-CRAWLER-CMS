import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Avatar, Typography, Space, Tag, Button, Descriptions, Spin, Alert, Result, App as AntdApp, Divider, Table } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CrownOutlined, SafetyCertificateOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import PageHeader from '@core/components/PageHeader';
import StatusTag from '@core/components/StatusTag';
import { formatDateTime } from '@core/utils/formatDate';
import { fetchUserDetail } from '../store/user/userThunks';
import { ROLE_CONFIGS } from '../configs/userConstants';
import AccessDeny from '@/components/AccessDeny';

const { Title, Text, Paragraph } = Typography;

export default function UserDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { message } = AntdApp.useApp();

	const { currentUser: user, detailLoading: loading, error } = useSelector((state) => state.user);

	useEffect(() => {
		if (id) {
			dispatch(fetchUserDetail(id));
		}
	}, [dispatch, id]);

	if (loading) {
		return (
			<div style={{ padding: 40, textAlign: 'center' }}>
				<Spin size="large" tip="Loading user profile..." />
			</div>
		);
	}

	if (error) {
		const isForbidden = error.includes('Forbidden') || error.includes('403');
		if (isForbidden) {
			return <AccessDeny />;
		}

		return (
			<div>
				<Alert
					type="error"
					showIcon
					message="Failed to load user details"
					description={error}
					action={
						<Button type="primary" onClick={() => navigate('/user')}>
							Back to Users
						</Button>
					}
					style={{ borderRadius: 8, margin: 20 }}
				/>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const primaryRole = user.roles?.[0]?.slug || 'viewer';
	const roleCfg = ROLE_CONFIGS[primaryRole] || ROLE_CONFIGS.viewer;
	const matrix = user.permissions_matrix || {};

	const matrixDataSource = [
		{
			key: 'crawler',
			module: 'Crawler Module',
			view: matrix.crawler?.view,
			edit: matrix.crawler?.edit,
		},
		{
			key: 'tiktok_account',
			module: 'TikTok Accounts',
			view: matrix.tiktok_account?.view,
			edit: matrix.tiktok_account?.edit,
		},
		{
			key: 'core',
			module: 'Core System',
			view: matrix.core?.view,
			edit: matrix.core?.edit,
		},
		{
			key: 'user',
			module: 'User Management',
			view: matrix.user?.view,
			edit: matrix.user?.edit,
		},
	];

	const matrixColumns = [
		{
			title: 'System Module',
			dataIndex: 'module',
			key: 'module',
			width: '50%',
			render: (text: string) => <Text strong>{text}</Text>,
		},
		{
			title: 'View Access',
			dataIndex: 'view',
			key: 'view',
			align: 'center' as const,
			render: (val: boolean) =>
				val ? (
					<Tag color="success" icon={<CheckCircleFilled />}>
						Allowed
					</Tag>
				) : (
					<Tag color="default" icon={<CloseCircleFilled />}>
						Denied
					</Tag>
				),
		},
		{
			title: 'Edit Access',
			dataIndex: 'edit',
			key: 'edit',
			align: 'center' as const,
			render: (val: boolean) =>
				val ? (
					<Tag color="blue" icon={<CheckCircleFilled />}>
						Allowed
					</Tag>
				) : (
					<Tag color="default" icon={<CloseCircleFilled />}>
						Denied
					</Tag>
				),
		},
	];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			{/* Standardized PageHeader matching all modules */}
			<PageHeader
				title={`User: ${user.name}`}
				subtitle="View user account profile details, assigned role, and module permissions matrix."
				onBack={() => navigate('/user')}
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Users', href: '/admin/user' }, { title: user.name || 'User Detail' }]}
				extra={
					<Space wrap>
						<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/user')}>
							Back to Users
						</Button>
						<Link to={`/user/${user.id}/edit`}>
							<Button type="primary" icon={<EditOutlined />}>
								Edit User
							</Button>
						</Link>
					</Space>
				}
			/>

			{/* Profile Overview Card */}
			<Card
				style={{
					borderRadius: 12,
					border: '1px solid #edf0f5',
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

			<Row gutter={[20, 20]}>
				{/* Account Details */}
				<Col xs={24} lg={12}>
					<Card
						title="Account Information"
						bordered={false}
						style={{
							borderRadius: 12,
							border: '1px solid #edf0f5',
							height: '100%',
							boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
						}}
					>
						<Descriptions column={1} bordered size="small">
							<Descriptions.Item label="User ID">
								<span style={{ fontWeight: 600, color: '#1677ff' }}>#{user.id}</span>
							</Descriptions.Item>
							<Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
							<Descriptions.Item label="Email Address">{user.email}</Descriptions.Item>
							<Descriptions.Item label="Phone Number">{user.phone || '—'}</Descriptions.Item>
							<Descriptions.Item label="Status">
								<StatusTag status={user.status} />
							</Descriptions.Item>
							<Descriptions.Item label="Email Verified">
								{user.email_verified_at ? <Tag color="success">Verified ({formatDateTime(user.email_verified_at)})</Tag> : <Tag color="default">Unverified</Tag>}
							</Descriptions.Item>
							<Descriptions.Item label="Created At">{formatDateTime(user.created_at)}</Descriptions.Item>
							<Descriptions.Item label="Last Updated">{formatDateTime(user.updated_at)}</Descriptions.Item>
						</Descriptions>
					</Card>
				</Col>

				{/* Role & Privileges */}
				<Col xs={24} lg={12}>
					<Card
						title="Role & Assigned Privileges"
						bordered={false}
						style={{
							borderRadius: 12,
							border: '1px solid #edf0f5',
							height: '100%',
							boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
						}}
					>
						<div
							style={{
								padding: 16,
								borderRadius: 8,
								background: roleCfg.bg,
								border: `1px solid ${roleCfg.border}`,
								marginBottom: 16,
							}}
						>
							<Space size={8} align="center">
								{user.is_admin ? <CrownOutlined style={{ color: roleCfg.color, fontSize: 20 }} /> : <SafetyCertificateOutlined style={{ color: roleCfg.color, fontSize: 20 }} />}
								<Text strong style={{ fontSize: 16, color: roleCfg.color }}>
									{roleCfg.name}
								</Text>
							</Space>
							<Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 13 }}>
								{roleCfg.description}
							</Paragraph>
						</div>

						<Title level={5} style={{ marginBottom: 12 }}>
							Module Access Matrix
						</Title>
						<Table dataSource={matrixDataSource} columns={matrixColumns} pagination={false} size="small" bordered style={{ borderRadius: 8, overflow: 'hidden' }} />
					</Card>
				</Col>
			</Row>
		</div>
	);
}
