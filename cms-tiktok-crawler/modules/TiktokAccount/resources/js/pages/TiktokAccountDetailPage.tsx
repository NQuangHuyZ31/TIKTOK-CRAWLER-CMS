import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	Alert,
	App as AntdApp,
	Avatar,
	Button,
	Card,
	Col,
	Descriptions,
	Popconfirm,
	Row,
	Space,
	Typography,
} from 'antd';
import {
	CalendarOutlined,
	DeleteOutlined,
	EditOutlined,
	HeartOutlined,
	LinkOutlined,
	UserAddOutlined,
	UserOutlined,
} from '@ant-design/icons';
import tiktokAccountAPI from '../Action/tiktokAccount';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';
import CardKPI from '@core/components/CardKPI';
import StatusTag from '@core/components/StatusTag';
import formatCurrency from '@core/utils/formatCurrency';
import CrawlResultTable from '@modules/Crawler/resources/js/components/CrawlResultTable';

const { Text, Title } = Typography;

export default function TiktokAccountDetailPage() {
	const { message } = AntdApp.useApp();
	const { id } = useParams();
	const navigate = useNavigate();

	// Local states for account detail
	const [accountData, setAccountData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingStatus, setUpdatingStatus] = useState(false);
	const [deleting, setDeleting] = useState(false);
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

	// Change account status (active/inactive)
	const handleStatusChange = async () => {
		if (!id) return;
		const nextStatus = accountData?.status === 'active' ? 'inactive' : 'active';
		setUpdatingStatus(true);

		try {
			const result: any = await tiktokAccountAPI.updateTiktokAccountStatus(id, nextStatus);
			message.success(result?.message || 'Status update completed');
			setAccountData((prev: any) => ({ ...prev, status: nextStatus }));
		} catch (statusError: any) {
			message.error(statusError?.response?.data?.message ?? statusError?.message ?? 'Status update failed');
		} finally {
			setUpdatingStatus(false);
		}
	};

	// Handle delete account
	const handleDelete = async () => {
		if (!id) return;
		setDeleting(true);
		try {
			const result: any = await tiktokAccountAPI.deleteTiktokAccount(id);
			message.success(result?.message || 'Account deleted successfully');
			navigate('/tiktok-account');
		} catch (deleteError: any) {
			message.error(deleteError?.response?.data?.message ?? deleteError?.message ?? 'Failed to delete account');
			setDeleting(false);
		}
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
				subtitle="Review profile information and crawl activity."
				onBack={() => navigate('/tiktok-account')}
				extra={
					<Space wrap>
						<Button icon={<EditOutlined />} onClick={() => navigate(`/tiktok-account/${id}/edit`)}>
							Edit
						</Button>
						<Button
							type={accountData?.status === 'active' ? 'default' : 'primary'}
							loading={updatingStatus}
							onClick={handleStatusChange}
						>
							{accountData?.status === 'active' ? 'Set Inactive' : 'Set Active'}
						</Button>
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
					</Space>
				}
			/>

			<Card>
				<Space align="start" size={20} wrap>
					<Avatar size={96} src={accountData?.avatar_path || accountData?.avatar_url} icon={<UserOutlined />} />
					<Space direction="vertical" size={6}>
						<Space align="center">
							<Title level={4} style={{ margin: 0 }}>
								{accountData?.nickname || accountData?.username || '-'}
							</Title>
							<StatusTag status={accountData?.status} />
						</Space>
						<Text type="secondary">@{accountData?.username || '-'}</Text>
						<Space wrap>
							{accountData?.profile_url && (
								<Link to={accountData?.profile_url} target="_blank" rel="noopener noreferrer">
									<LinkOutlined /> {accountData?.profile_url}
								</Link>
							)}
							<Text type="secondary">
								<CalendarOutlined /> Last crawled: {accountData?.last_crawled_at || 'Never'}
							</Text>
						</Space>
					</Space>
				</Space>
			</Card>

			{/* Reusing CardKPI instead of raw Statistic */}
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={8}>
					<CardKPI title="Followers" value={formatCurrency(accountData?.followers_count || 0)} icon={<UserAddOutlined />} color="#1677ff" />
				</Col>
				<Col xs={24} sm={8}>
					<CardKPI title="Following" value={formatCurrency(accountData?.following_count || 0)} icon={<UserOutlined />} color="#52c41a" />
				</Col>
				<Col xs={24} sm={8}>
					<CardKPI title="Likes" value={formatCurrency(accountData?.likes_count || 0)} icon={<HeartOutlined />} color="#fa8c16" />
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
					<Descriptions.Item label="First Crawled">{accountData?.created_at || 'Unknown'}</Descriptions.Item>
					<Descriptions.Item label="Last Crawled">{accountData?.last_crawled_at || 'Never'}</Descriptions.Item>
					<Descriptions.Item label="Profile URL" span={3}>
						{accountData?.profile_url ? (
							<Link to={accountData?.profile_url} target="_blank" rel="noopener noreferrer">
								{accountData?.profile_url}
							</Link>
						) : (
							'-'
						)}
					</Descriptions.Item>
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
				{showCrawlHistory && (
					<CrawlResultTable
						data={results}
						loading={resultsLoading}
						pagination={pagination}
						onPageChange={(page, per_page) => loadResults(page, per_page)}
					/>
				)}
			</Card>
		</Space>
	);
}

