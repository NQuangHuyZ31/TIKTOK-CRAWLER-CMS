import {
	CalendarOutlined,
	EditOutlined,
	HeartOutlined,
	LinkOutlined,
	UserAddOutlined,
	UserOutlined,
} from '@ant-design/icons';
import {
	Alert,
	Avatar,
	Button,
	Card,
	Col,
	Descriptions,
	Row,
	Space,
	Statistic,
	Tag,
	Typography,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTiktokAccountByID } from '@modules/TiktokAccount/assets/js/store/tiktokAccount/tiktokAccountThunks';
import DeleteAccount from '@modules/TiktokAccount/assets/js/components/DeleteAccount';
import SpinComponent from '@modules/Core/assets/js/components/SpinComponent';
import formatCurrency from '@modules/Core/assets/js/utils/formatCurrency';

const { Text, Title } = Typography;

export default function TiktokAccountDetailPage() {
	const dispatch = useDispatch();
	const { id } = useParams();

	const { currentAccount: accountData, loading, error } = useSelector((state) => state.tiktokAccount);

	useEffect(() => {
		dispatch(fetchTiktokAccountByID(id));
	}, [id, dispatch]);

	if (error) {
		return <Alert type="error" title={error} showIcon />;
	}

	return (
		<Space orientation="vertical" size={24} style={{ width: '100%' }}>
			<Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
				<Space orientation="vertical" size={4}>
					<Title level={3} style={{ margin: 0 }}>Account details</Title>
					<Text type="secondary">Review profile information and crawl activity.</Text>
				</Space>
				<Space orientation="horizontal" size={4}>
					<Button icon={<EditOutlined />}>Edit</Button>
					{accountData?.status === 'active' ? (
						<Button type="default">InActive</Button>
					) : <Button type="primary">Active</Button>}
					<DeleteAccount accountId={id} />
				</Space>
			</Space>

			<Card>
				<Space align="start" size={20} wrap>
					<Avatar size={96} src={accountData?.avatar_path} icon={<UserOutlined />} />
					<Space orientation="vertical" size={6}>
						<Space align="center">
							<Title level={4} style={{ margin: 0 }}>{accountData?.username || '-'}</Title>
							<Tag color="success">Active</Tag>
						</Space>
						<Text type="secondary">{accountData?.username || '-'} - {accountData?.status || 'Unknown'}</Text>
						<Space wrap>
							<Link to={accountData?.profile_url} target="_blank" rel="noopener noreferrer" ><LinkOutlined /> {accountData?.profile_url}</Link>
							<Text type="secondary"><CalendarOutlined /> Last crawled: {accountData?.last_crawled_at || 'Unknown'}</Text>
						</Space>
					</Space>
				</Space>
			</Card>

			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={6}>
					<Card><Statistic title="Followers" value={formatCurrency(accountData?.followers_count || 0)} prefix={<UserAddOutlined />} /></Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card><Statistic title="Following" value={formatCurrency(accountData?.following_count || 0)} prefix={<UserOutlined />} /></Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card><Statistic title="Likes" value={formatCurrency(accountData?.likes_count || 0)} prefix={<HeartOutlined />} /></Card>
				</Col>
			</Row>

			<Card title="Profile information">
				<Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
					<Descriptions.Item label="Account ID">{id || '-'}</Descriptions.Item>
					<Descriptions.Item label="Username">{accountData?.username || '-'}</Descriptions.Item>
					<Descriptions.Item label="Status"><Tag color={accountData?.status === 'active' ? 'success' : 'error'}>{accountData?.status || 'Unknown'}</Tag></Descriptions.Item>
					<Descriptions.Item label="First crawled">{accountData?.created_at || 'Unknown'}</Descriptions.Item>
					<Descriptions.Item label="Last crawled">{accountData?.last_crawled_at || 'Unknown'}</Descriptions.Item>
					<Descriptions.Item label="Profile URL">{accountData?.profile_url || 'Unknown'}</Descriptions.Item>
				</Descriptions>
			</Card>
			{loading && <SpinComponent />}
		</Space >
	);
}
