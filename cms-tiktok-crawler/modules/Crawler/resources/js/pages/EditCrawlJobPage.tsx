import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, InputNumber, Radio, Space, Typography, App as AntdApp } from 'antd';
import { ArrowLeftOutlined, DatabaseOutlined, LinkOutlined, NumberOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import crawlJobAPI from '../Action/crawlJob';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import SpinComponent from '@core/components/SpinComponent';
import PageHeader from '@core/components/PageHeader';


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

	// Fetch job details directly via API
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
				setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load crawl job details');
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
			message.success(result?.message || 'Crawl job updated successfully');
			navigate(`/crawler/crawl-job/${id}`);
		} catch (err: any) {
			message.error(err?.response?.data?.message ?? err?.message ?? 'Failed to update crawl job');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <SpinComponent />;
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title={`Edit Crawl Job #${id}`}
				subtitle="Only pending crawl jobs can be modified."
				onBack={() => navigate(`/crawler/crawl-job/${id}`)}
			/>

			<Card style={{ maxWidth: 680 }}>
				{error && <Alert type="error" title={error} showIcon style={{ marginBottom: 24 }} />}
				{job?.status !== 'pending' ? (
					<Alert type="warning" title="This crawl job is no longer pending." showIcon />
				) : (
					<Form form={form} layout="vertical" onFinish={handleSubmit}>
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
								name="usernames"
								label="Username List"
								rules={[{ required: true, message: 'Please enter username' }]}
							>
								<Input.TextArea rows={6} />
							</Form.Item>
						)}

						{sourceType === 'urls' && (
							<Form.Item
								name="urls"
								label="TikTok URL List"
								rules={[{ required: true, message: 'Please enter URL' }]}
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
								label="Account Count"
								rules={[{ required: true, message: 'Please enter account count' }]}
							>
								<InputNumber min={1} precision={0} style={{ width: '100%' }} />
							</Form.Item>
						)}

						<Space>
							<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/crawler/crawl-job/${id}`)}>
								Cancel
							</Button>
							<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
								Save Changes
							</Button>
						</Space>
					</Form>
				)}
			</Card>
		</div>
	);
}
