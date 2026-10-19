import { useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, InputNumber, message, Radio, Space, Typography, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '@core/store';
import { createCrawlJob } from '../store/crawlJob/crawlJobThunks';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import SpinComponent from '@core/components/SpinComponent';

const { Text, Title } = Typography;

export default function CreateCrawlJobPage() {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { loading, error } = useSelector((state) => state.crawlJob);

	const [form] = Form.useForm();
	const sourceType = Form.useWatch('source_type', form);

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

	const handleSubmit = async (values) => {
		const dataCrawl = values.source_type === 'usernames'
			? values.usernames?.split('\n').map((value) => value.trim()).filter(Boolean) ?? []
			: values.source_type === 'urls'
				? values.urls?.split('\n').map((value) => value.trim()).filter(Boolean) ?? []
				: values.source_type === 'database'
					? values.account_ids ?? []
					: (values.total_accounts ? [values.total_accounts] : []);

		try {
			const result = await dispatch(createCrawlJob({ source_type: values.source_type, data_crawl: dataCrawl })).unwrap();
			const job = result?.data ?? result;
			const jobId = job?.id;

			if (!jobId) {
				throw new Error('Không thể lấy ID của crawl job');
			}

			message.success(result?.message || 'Create completed');
			navigate(`/crawler/crawl-job/${jobId}`);
		} catch (error) {
			message.error(error?.message || error || 'Create failed');
			return;
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
						<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
							Tạo job
						</Button>
					</Space>
				</Form>
			</Card>

			{loading && (
				<SpinComponent />
			)}
		</div>
	);
}
