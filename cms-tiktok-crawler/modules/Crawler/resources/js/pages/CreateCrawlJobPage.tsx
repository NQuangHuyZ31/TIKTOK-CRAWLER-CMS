import { useState } from 'react';
import { Button, Card, Divider, Form, Input, InputNumber, Radio, Space, Typography, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import crawlJobAPI from '../Action/crawlJob';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import PageHeader from '@core/components/PageHeader';


export default function CreateCrawlJobPage() {
	const { message } = AntdApp.useApp();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);

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

	const handleSubmit = async (values: any) => {
		const dataCrawl = values.source_type === 'usernames'
			? values.usernames?.split('\n').map((value: string) => value.trim()).filter(Boolean) ?? []
			: values.source_type === 'urls'
				? values.urls?.split('\n').map((value: string) => value.trim()).filter(Boolean) ?? []
				: values.source_type === 'database'
					? values.account_ids ?? []
					: (values.total_accounts ? [values.total_accounts] : []);

		setLoading(true);
		try {
			const result = await crawlJobAPI.createCrawlJob({
				source_type: values.source_type,
				data_crawl: dataCrawl,
			});
			const job = result?.data ?? result;
			const jobId = job?.id;

			message.success(result?.message || 'Crawl job created successfully');
			if (jobId) {
				navigate(`/crawler/crawl-job/${jobId}`);
			} else {
				navigate('/crawler/crawl-job');
			}
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to create crawl job');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title="Create Crawl Job"
				subtitle="Configure settings for a new crawl session."
				onBack={() => navigate('/crawler/crawl-job')}
			/>

			<Card style={{ maxWidth: 680 }}>
				<Form
					form={form}
					layout="vertical"
					initialValues={{ source_type: 'usernames', account_ids: [] }}
					onFinish={handleSubmit}
				>
					<Form.Item name="source_type" label="Account Source">
						<Radio.Group optionType="button" buttonStyle="solid" onChange={handleSourceChange}>
							<Radio.Button value="usernames"><UserOutlined /> Username</Radio.Button>
							<Radio.Button value="urls"><LinkOutlined /> URL</Radio.Button>
							<Radio.Button value="database"><DatabaseOutlined /> From Database</Radio.Button>
							<Radio.Button value="count"><NumberOutlined /> Count</Radio.Button>
						</Radio.Group>
					</Form.Item>

					{sourceType === 'usernames' && (
						<Form.Item
							preserve={false}
							name="usernames"
							label="Username List"
							extra="One username per line, without '@' symbol."
							rules={[{ required: true, message: 'Please enter at least one username' }]}
						>
							<Input.TextArea rows={6} placeholder={'huyak\nmegjs_finds'} />
						</Form.Item>
					)}

					{sourceType === 'urls' && (
						<Form.Item
							preserve={false}
							name="urls"
							label="TikTok URL List"
							extra="One URL per line."
							rules={[{ required: true, message: 'Please enter at least one URL' }]}
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
								label="Account Count"
								extra="Enter the number of accounts to crawl."
								rules={[{ required: true, message: 'Please enter account count' }]}
							>
								<InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Enter account count" />
							</Form.Item>
						</>
					)}

					<Space>
						<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/crawler/crawl-job')}>
							Cancel
						</Button>
						<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
							Create Job
						</Button>
					</Space>
				</Form>
			</Card>
		</div>
	);
}
