import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Radio, Space, Typography, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import crawlJobAPI from '../Action/crawlJob';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import SpinComponent from '@core/components/SpinComponent';

const { Text, Title } = Typography;

export default function EditCrawlJobPage() {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const { id } = useParams();

	const [job, setJob] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [form] = Form.useForm();
	const sourceType = Form.useWatch('source_type', form);

	// Fetch chi tiết job trực tiếp qua API
	useEffect(() => {
		if (!id) return;
		let mounted = true;
		setLoading(true);

		crawlJobAPI.getCrawlJobByID(id)
			.then((res: any) => {
				if (!mounted) return;
				const jobData = res?.data ?? res;
				setJob(jobData);
				const values = Array.isArray(jobData.data_crawl) ? jobData.data_crawl : [];
				form.setFieldsValue({
					source_type: jobData.source_type,
					usernames: jobData.source_type === 'usernames' ? values.join('\n') : undefined,
					urls: jobData.source_type === 'urls' ? values.join('\n') : undefined,
					account_ids: jobData.source_type === 'database' ? values : [],
					total_accounts: jobData.source_type === 'count' ? values[0] : undefined,
				});
			})
			.catch((err: any) => {
				if (!mounted) return;
				setError(err?.response?.data?.message ?? err?.message ?? 'Không thể tải thông tin crawl job');
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, [id, form]);

	const handleSourceChange = (e: any) => {
		const value = e?.target?.value;
		form.setFieldsValue({
			source_type: value,
			usernames: undefined,
			urls: undefined,
			account_ids: [],
			total_accounts: undefined,
		});
	};

	const handleSubmit = async (values: any) => {
		if (!id) return;
		const dataCrawl = values.source_type === 'usernames'
			? values.usernames?.split('\n').map((value: string) => value.trim()).filter(Boolean) ?? []
			: values.source_type === 'urls'
				? values.urls?.split('\n').map((value: string) => value.trim()).filter(Boolean) ?? []
				: values.source_type === 'database'
					? values.account_ids ?? []
					: [values.total_accounts];

		setSaving(true);
		try {
			const result = await crawlJobAPI.updateCrawlJob(id, {
				source_type: values.source_type,
				data_crawl: dataCrawl,
			});
			message.success(result?.message || 'Cập nhật crawl job thành công');
			navigate(`/crawler/crawl-job/${id}`);
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Cập nhật crawl job thất bại');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <SpinComponent />;
	}

	return (
		<div>
			<Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
				<Title level={4} style={{ margin: 0 }}>Chỉnh sửa Crawl Job #{id}</Title>
				<Text type="secondary">Chỉ crawl job đang pending mới có thể chỉnh sửa.</Text>
			</Space>

			<Card style={{ maxWidth: 680 }}>
				{error && <Alert type="error" title={error} showIcon style={{ marginBottom: 24 }} />}
				{job?.status !== 'pending' ? (
					<Alert type="warning" title="Crawl job này không còn ở trạng thái pending." showIcon />
				) : (
					<Form form={form} layout="vertical" onFinish={handleSubmit}>
						<Form.Item name="source_type" label="Nguồn tài khoản">
							<Radio.Group optionType="button" buttonStyle="solid" onChange={handleSourceChange}>
								<Radio.Button value="usernames"><UserOutlined /> Username</Radio.Button>
								<Radio.Button value="urls"><LinkOutlined /> URL</Radio.Button>
								<Radio.Button value="database"><DatabaseOutlined /> Từ database</Radio.Button>
								<Radio.Button value="count"><NumberOutlined /> Số lượng</Radio.Button>
							</Radio.Group>
						</Form.Item>

						{sourceType === 'usernames' && (
							<Form.Item
								name="usernames"
								label="Danh sách username"
								rules={[{ required: true, message: 'Vui lòng nhập username' }]}
							>
								<Input.TextArea rows={6} />
							</Form.Item>
						)}

						{sourceType === 'urls' && (
							<Form.Item
								name="urls"
								label="Danh sách URL TikTok"
								rules={[{ required: true, message: 'Vui lòng nhập URL' }]}
							>
								<Input.TextArea rows={6} />
							</Form.Item>
						)}

						{sourceType === 'database' && (
							<TiktokAccountSelect onChange={(value) => form.setFieldsValue({ account_ids: value })} />
						)}

						{sourceType === 'count' && (
							<Form.Item
								name="total_accounts"
								label="Số lượng account"
								rules={[{ required: true, message: 'Vui lòng nhập số lượng account' }]}
							>
								<InputNumber min={1} precision={0} style={{ width: '100%' }} />
							</Form.Item>
						)}

						<Space>
							<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/crawler/crawl-job/${id}`)}>
								Hủy
							</Button>
							<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
								Lưu thay đổi
							</Button>
						</Space>
					</Form>
				)}
			</Card>
		</div>
	);
}
