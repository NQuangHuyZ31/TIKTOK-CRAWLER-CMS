import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, Col, Descriptions, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleFilled, DeleteOutlined, EditOutlined, HeartOutlined, LinkOutlined, UserAddOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import useAction from '@core/hooks/useAction';
import tiktokAccountAPI from '../Action/tiktokAccount';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import CardKPI from '@core/components/CardKPI';
import StatusTag from '@core/components/StatusTag';
import PermissionGate from '@core/components/PermissionGate';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import CrawlResultTable from '@modules/Crawler/resources/js/components/CrawlResultTable';

const { Text, Title, Paragraph } = Typography;

export default function TiktokAccountDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	// Local states for account detail
	const [accountData, setAccountData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { act, loading: deleting } = useAction();
	const [showCrawlHistory, setShowCrawlHistory] = useState(true);

	// Local states for crawl results
	const [results, setResults] = useState<any[]>([]);
	const [resultsLoading, setResultsLoading] = useState(false);
	const [pagination, setPagination] = useState({ page: 1, per_page: 10, total: 0 });

	// Fetch account details
	const loadAccountDetail = useCallback(async () => {
		if (!id) return;
		try {
			const res: any = await tiktokAccountAPI.getTiktokAccountByID(id);
			setAccountData(res?.data ?? res);
		} catch (err: any) {
			setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load account details');
		} finally {
			setLoading(false);
		}
	}, [id]);

	// Fetch crawl results
	const loadResults = useCallback(
		async (page = 1, perPage = 10) => {
			if (!id) return;
			setResultsLoading(true);
			try {
				const res: any = await tiktokAccountAPI.getResults(id, { page, per_page: perPage });
				setResults(res?.data ?? []);
				setPagination({
					page: res?.meta?.current_page ?? page,
					per_page: res?.meta?.per_page ?? perPage,
					total: res?.meta?.total ?? 0,
				});
			} catch {
				// Silently handled
			} finally {
				setResultsLoading(false);
			}
		},
		[id],
	);

	useEffect(() => {
		loadAccountDetail();
		loadResults(1, 10);
	}, [loadAccountDetail, loadResults]);

	// Handle delete account
	const handleDelete = () => {
		if (!id) return;
		act(() => tiktokAccountAPI.deleteTiktokAccount(id), 'Account deleted successfully', () => navigate('/tiktok-account'));
	};

	// Toggle the visibility of the crawl history section
	const handleViewCrawlHistory = () => {
		setShowCrawlHistory((prev) => !prev);
	};

	if (loading) {
		return <SpinComponent />;
	}

	if (error) {
		return <Alert type="error" message={error} showIcon />;
	}

	return (
		<Space direction="vertical" size={24} style={{ width: '100%' }}>
			{/* Shared PageHeader */}
			<PageHeader
				title={`Account @${accountData?.username || id}`}
				subtitle="Review profile information, follower analytics, and crawl activity."
				onBack={() => navigate('/tiktok-account')}
				extra={
					<Space wrap>
						<PermissionGate module="tiktok_account" action="edit">
							<Button icon={<EditOutlined />} onClick={() => navigate(`/tiktok-account/${id}/edit`)}>
								Edit Profile
							</Button>
						</PermissionGate>

						<PermissionGate module="tiktok_account" action="delete">
							<Popconfirm
								title="Delete TikTok account"
								description="Are you sure you want to delete this account?"
								onConfirm={handleDelete}
								okText="Delete"
								cancelText="Cancel"
								okButtonProps={{ danger: true, loading: deleting }}
							>
								<Button danger icon={<DeleteOutlined />} loading={deleting}>
									Delete
								</Button>
							</Popconfirm>
						</PermissionGate>
					</Space>
				}
			/>

			<Card>
				<Space align="start" size={20} wrap>
					<Avatar size={96} src={accountData?.avatar_path} icon={<UserOutlined />} />
					<Space direction="vertical" size={6}>
						<Space align="center" wrap>
							<Title level={4} style={{ margin: 0 }}>
								{accountData?.nickname || accountData?.username || '-'}
							</Title>
							{accountData?.is_verified ? (
								<Tag icon={<CheckCircleFilled />} color="blue">
									Verified
								</Tag>
							) : null}
							<StatusTag status={accountData?.status} />
						</Space>
						<Text type="secondary">@{accountData?.username || '-'}</Text>
						{accountData?.bio && (
							<Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ margin: 0, maxWidth: 600 }}>
								{accountData.bio}
							</Paragraph>
						)}
						<Space wrap>
							{accountData?.profile_url && (
								<Link to={accountData?.profile_url} target="_blank" rel="noopener noreferrer">
									<LinkOutlined /> {accountData?.profile_url}
								</Link>
							)}
							<Text type="secondary">
								<CalendarOutlined /> Last crawled: {accountData?.last_crawled_at ? formatDateTime(accountData.last_crawled_at) : 'Never'}
							</Text>
						</Space>
					</Space>
				</Space>
			</Card>

			{/* Reusing CardKPI with formatNumber */}
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} md={6}>
					<CardKPI title="Followers" value={formatNumber(accountData?.followers_count || 0)} icon={<UserAddOutlined />} color="#1677ff" />
				</Col>
				<Col xs={24} sm={12} md={6}>
					<CardKPI title="Following" value={formatNumber(accountData?.following_count || 0)} icon={<UserOutlined />} color="#52c41a" />
				</Col>
				<Col xs={24} sm={12} md={6}>
					<CardKPI title="Likes" value={formatNumber(accountData?.likes_count || 0)} icon={<HeartOutlined />} color="#fa8c16" />
				</Col>
				<Col xs={24} sm={12} md={6}>
					<CardKPI title="Videos" value={formatNumber(accountData?.video_count || 0)} icon={<VideoCameraOutlined />} color="#722ed1" />
				</Col>
			</Row>

			<Card title="Profile Information">
				<Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
					<Descriptions.Item label="Account ID">#{id || '-'}</Descriptions.Item>
					<Descriptions.Item label="Username">@{accountData?.username || '-'}</Descriptions.Item>
					<Descriptions.Item label="Nickname">{accountData?.nickname || '-'}</Descriptions.Item>
					<Descriptions.Item label="Status">
						<StatusTag status={accountData?.status} />
					</Descriptions.Item>
					<Descriptions.Item label="Verified Badge">
						{accountData?.is_verified ? (
							<Tag icon={<CheckCircleFilled />} color="blue">
								Verified
							</Tag>
						) : (
							<Text type="secondary">Not Verified</Text>
						)}
					</Descriptions.Item>
					<Descriptions.Item label="Sec UID">{accountData?.sec_uid || '-'}</Descriptions.Item>
					<Descriptions.Item label="First Crawled">{accountData?.created_at ? formatDateTime(accountData.created_at) : 'Unknown'}</Descriptions.Item>
					<Descriptions.Item label="Last Crawled">{accountData?.last_crawled_at ? formatDateTime(accountData.last_crawled_at) : 'Never'}</Descriptions.Item>
					<Descriptions.Item label="Total Videos">{formatNumber(accountData?.video_count || 0)}</Descriptions.Item>
					<Descriptions.Item label="Profile URL" span={3}>
						{accountData?.profile_url ? (
							<Link to={accountData?.profile_url} target="_blank" rel="noopener noreferrer">
								{accountData?.profile_url}
							</Link>
						) : (
							'-'
						)}
					</Descriptions.Item>
					{accountData?.bio && (
						<Descriptions.Item label="Bio" span={3}>
							{accountData.bio}
						</Descriptions.Item>
					)}
				</Descriptions>
			</Card>

			<Card
				title="Crawl History"
				extra={
					<Button type="primary" onClick={handleViewCrawlHistory}>
						{showCrawlHistory ? 'Hide' : 'Show'} Crawl History
					</Button>
				}
			>
				{showCrawlHistory && <CrawlResultTable data={results} loading={resultsLoading} pagination={pagination} onPageChange={(page, per_page) => loadResults(page, per_page)} />}
			</Card>
		</Space>
	);
}
