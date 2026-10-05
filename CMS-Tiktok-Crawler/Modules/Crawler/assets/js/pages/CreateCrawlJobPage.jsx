import { useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, InputNumber, Radio, Select, Space, Typography } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import crawlJobAPI from '@modules/Crawler/assets/js/services/api';
import TiktokAccountSelect from '@modules/Crawler/assets/js/components/TiktokAccountSelect';

const { Text, Title } = Typography;

export default function CreateCrawlJobPage() {
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const sourceType = Form.useWatch('source_type', form);

	const handleSourceChange = ({ target: { value } }) => {
		form.setFieldsValue({
			source_type: value,
			usernames: undefined,
			urls: undefined,
			account_ids: [],
			total_accounts: undefined,
		});
	};
	console.log('account_ids', form.getFieldValue('account_ids'));
	const handleSubmit = async (values) => {
		setSubmitting(true);
		setError('');

		try {
			const sourcePayload = values.source_type === 'usernames'
				? { usernames: values.usernames?.split('\n').map((value) => value.trim()).filter(Boolean) ?? [] }
				: values.source_type === 'urls'
					? { urls: values.urls?.split('\n').map((value) => value.trim()).filter(Boolean) ?? [] }
					: values.source_type === 'database'
						? { account_ids: values.account_ids ?? [] }
						: { total_accounts: values.total_accounts };

			const createdJob = await crawlJobAPI.createCrawlJob({
				status: 'pending',
				source_type: values.source_type,
				...sourcePayload,
			});
			const jobId = createdJob?.data?.id ?? createdJob?.id;

			if (!jobId) {
				throw new Error('API không trả về ID của crawl job');
			}

			message.success('Đã tạo crawl job');
			navigate(`/crawl-jobs/${jobId}`);
		} catch (err) {
			const errorMessage = err.response?.data?.message || err.message || 'Không thể tạo crawl job';
			setError(errorMessage);
			message.error(errorMessage);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div>
			<Space orientation="vertical" size={4} style={{ marginBottom: 24 }}>
				<Title level={4} style={{ margin: 0 }}>Tạo Crawl Job</Title>
				<Text type="secondary">Thiết lập thông tin cho phiên crawl mới.</Text>
			</Space>

			<Card style={{ maxWidth: 680 }}>
				{error && <Alert type="error" title={error} showIcon style={{ marginBottom: 24 }} />}
				<Form
					form={form}
					layout="vertical"
					initialValues={{ source_type: 'usernames', account_ids: [] }}
					onFinish={handleSubmit}
				>
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
							preserve={false}
							name="usernames"
							label="Danh sách username"
							extra="Mỗi username một dòng, không cần ký tự @."
							rules={[{ required: true, message: 'Vui lòng nhập ít nhất một username' }]}
						>
							<Input.TextArea rows={6} placeholder={'huyak\nmegjs_finds'} />
						</Form.Item>
					)}

					{sourceType === 'urls' && (
						<Form.Item
							preserve={false}
							name="urls"
							label="Danh sách URL TikTok"
							extra="Mỗi URL một dòng."
							rules={[{ required: true, message: 'Vui lòng nhập ít nhất một URL' }]}
						>
							<Input.TextArea rows={6} placeholder={'https://www.tiktok.com/@huyak\nhttps://www.tiktok.com/@megjs_finds'} />
						</Form.Item>
					)}

					{sourceType === 'database' && (
						<TiktokAccountSelect onChange={(value) => form.setFieldsValue({ account_ids: value })} />
					)}

					{sourceType === 'count' && (
						<>
							<Divider style={{ margin: '8px 0 20px' }} />
							<Form.Item
								name="total_accounts"
								label="Số lượng account"
								extra="Nhập số lượng account cần crawl."
								rules={[{ required: true, message: 'Vui lòng nhập số lượng account' }]}
							>
								<InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Nhập số lượng account" />
							</Form.Item>
						</>
					)}

					<Space>
						<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/crawl-jobs')}>
							Hủy
						</Button>
						<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting}>
							Tạo job
						</Button>
					</Space>
				</Form>
			</Card>
		</div>
	);
}
