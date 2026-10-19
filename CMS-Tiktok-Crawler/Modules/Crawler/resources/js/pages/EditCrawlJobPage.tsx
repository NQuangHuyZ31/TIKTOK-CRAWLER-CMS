import { useEffect } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Radio, Space, Typography, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from '../../../../Core/resources/js/store';
import { fetchCrawlJobById, updateCrawlJob } from '../store/crawlJob/crawlJobThunks';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import Spin from '../../../../Core/resources/js/components/SpinComponent';

const { Text, Title } = Typography;

export default function EditCrawlJobPage() {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const { id } = useParams();
	const dispatch = useDispatch();
	const { currentJob: job, loading, error } = useSelector((state) => state.crawlJob);
	const [form] = Form.useForm();
	const sourceType = Form.useWatch('source_type', form);

	useEffect(() => {
		dispatch(fetchCrawlJobById(id));
	}, [dispatch, id]);

	useEffect(() => {
		if (!job || String(job.id) !== String(id)) return;
		const values = Array.isArray(job.data_crawl) ? job.data_crawl : [];
		form.setFieldsValue({
			source_type: job.source_type,
			usernames: job.source_type === 'usernames' ? values.join('\n') : undefined,
			urls: job.source_type === 'urls' ? values.join('\n') : undefined,
			account_ids: job.source_type === 'database' ? values : [],
			total_accounts: job.source_type === 'count' ? values[0] : undefined,
		});
	}, [form, id, job]);

	const handleSourceChange = (e: any) => {
		const value = e?.target?.value;
		form.setFieldsValue({ source_type: value, usernames: undefined, urls: undefined, account_ids: [], total_accounts: undefined });
	};

	const handleSubmit = async (values) => {
		const dataCrawl = values.source_type === 'usernames'
			? values.usernames?.split('\n').map((value) => value.trim()).filter(Boolean) ?? []
			: values.source_type === 'urls'
				? values.urls?.split('\n').map((value) => value.trim()).filter(Boolean) ?? []
				: values.source_type === 'database'
					? values.account_ids ?? []
					: [values.total_accounts];
		try {
			const result = await dispatch(updateCrawlJob({ id, data: { source_type: values.source_type, data_crawl: dataCrawl } })).unwrap();
			message.success(result?.message || 'Update completed');
			navigate(`/crawler/crawl-job/${id}`);
		} catch (editError) {
			message.error(editError?.message || editError || 'Update failed');
		}
	};

	return (
		<div>
			<Space orientation="vertical" size={4} style={{ marginBottom: 24 }}>
				<Title level={4} style={{ margin: 0 }}>Chỉnh sửa Crawl Job</Title>
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
						{sourceType === 'usernames' && <Form.Item name="usernames" label="Danh sách username" rules={[{ required: true, message: 'Vui lòng nhập username' }]}><Input.TextArea rows={6} /></Form.Item>}
						{sourceType === 'urls' && <Form.Item name="urls" label="Danh sách URL TikTok" rules={[{ required: true, message: 'Vui lòng nhập URL' }]}><Input.TextArea rows={6} /></Form.Item>}
						{sourceType === 'database' && <TiktokAccountSelect onChange={(value) => form.setFieldsValue({ account_ids: value })} />}
						{sourceType === 'count' && <Form.Item name="total_accounts" label="Số lượng account" rules={[{ required: true, message: 'Vui lòng nhập số lượng account' }]}><InputNumber min={1} precision={0} style={{ width: '100%' }} /></Form.Item>}
						<Space>
							<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/crawl-jobs/${id}`)}>Hủy</Button>
							<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Lưu</Button>
						</Space>
					</Form>
				)}
			</Card>
			{loading && <Spin />}
		</div>
	);
}
