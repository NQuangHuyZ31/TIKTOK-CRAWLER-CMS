import React from 'react';
import { Alert, Divider, Form, Input, InputNumber, Radio } from 'antd';
import { DatabaseOutlined, LinkOutlined, NumberOutlined, UserOutlined } from '@ant-design/icons';
import crawlJobAPI from '../Action/crawlJob';
import TiktokAccountSelect from '../components/TiktokAccountSelect';
import ResourceForm, { type ResourceFormRenderContext } from '@core/components/ResourceForm';

/**
 * Isolated form fields component obeying React Rules of Hooks.
 * Encapsulates Form.useWatch and field rendering.
 */
function CrawlJobFormFields({ form, isEdit, record }: ResourceFormRenderContext) {
	const sourceType = Form.useWatch('source_type', form);
	const isReadOnly = Boolean(isEdit && record && record.status !== 'pending');

	const handleSourceChange = (e: any) => {
		form.setFieldsValue({
			source_type: e?.target?.value,
			usernames: undefined,
			urls: undefined,
			account_ids: [],
			total_accounts: undefined,
		});
	};

	return (
		<>
			{isReadOnly && <Alert type="warning" message="This crawl job is no longer pending and cannot be modified." showIcon style={{ marginBottom: 16 }} />}

			<Form.Item name="source_type" label="Account Source">
				<Radio.Group optionType="button" buttonStyle="solid" onChange={handleSourceChange} disabled={isReadOnly}>
					<Radio.Button value="usernames">
						<UserOutlined /> Username
					</Radio.Button>
					<Radio.Button value="urls">
						<LinkOutlined /> URL
					</Radio.Button>
					<Radio.Button value="database">
						<DatabaseOutlined /> From Database
					</Radio.Button>
					<Radio.Button value="count">
						<NumberOutlined /> Count
					</Radio.Button>
				</Radio.Group>
			</Form.Item>

			{sourceType === 'usernames' && (
				<Form.Item preserve={false} name="usernames" label="Username List" extra="One username per line, without '@' symbol." rules={[{ required: true, message: 'Please enter at least one username' }]}>
					<Input.TextArea rows={6} placeholder={'huyak\nmegjs_finds'} disabled={isReadOnly} />
				</Form.Item>
			)}

			{sourceType === 'urls' && (
				<Form.Item preserve={false} name="urls" label="TikTok URL List" extra="One URL per line." rules={[{ required: true, message: 'Please enter at least one URL' }]}>
					<Input.TextArea rows={6} placeholder={'https://www.tiktok.com/@huyak\nhttps://www.tiktok.com/@megjs_finds'} disabled={isReadOnly} />
				</Form.Item>
			)}

			{sourceType === 'database' && <TiktokAccountSelect onChange={(value) => form.setFieldsValue({ account_ids: value })} />}

			{sourceType === 'count' && (
				<>
					<Divider style={{ margin: '8px 0 20px' }} />
					<Form.Item name="total_accounts" label="Account Count" extra="Enter the number of accounts to crawl." rules={[{ required: true, message: 'Please enter account count' }]}>
						<InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="Enter account count" disabled={isReadOnly} />
					</Form.Item>
				</>
			)}
		</>
	);
}

/**
 * Unified form page for both Creating and Editing Crawl Jobs
 * using Core's shared ResourceForm component.
 */
export default function CrawlJobFormPage() {
	return (
		<ResourceForm
			resourceName="Crawl Job"
			backUrl="/crawler/crawl-job"
			fetchRecord={async (id) => {
				const res = await crawlJobAPI.getCrawlJobByID(id);
				return res?.data ?? res;
			}}
			transformInitialValues={(jobData) => {
				const values = Array.isArray(jobData.data_crawl) ? jobData.data_crawl : [];
				return {
					source_type: jobData.source_type,
					usernames: jobData.source_type === 'usernames' ? values.join('\n') : undefined,
					urls: jobData.source_type === 'urls' ? values.join('\n') : undefined,
					account_ids: jobData.source_type === 'database' ? values : [],
					total_accounts: jobData.source_type === 'count' ? values[0] : undefined,
				};
			}}
			initialValues={{ source_type: 'usernames', account_ids: [] }}
			onCreate={async (values) => {
				const dataCrawl =
					values.source_type === 'usernames'
						? (values.usernames
								?.split('\n')
								.map((val: string) => val.trim())
								.filter(Boolean) ?? [])
						: values.source_type === 'urls'
							? (values.urls
									?.split('\n')
									.map((val: string) => val.trim())
									.filter(Boolean) ?? [])
							: values.source_type === 'database'
								? (values.account_ids ?? [])
								: values.total_accounts
									? [values.total_accounts]
									: [];

				const result = await crawlJobAPI.createCrawlJob({
					source_type: values.source_type,
					data_crawl: dataCrawl,
				});
				return result?.data ?? result;
			}}
			onUpdate={async (id, values) => {
				const dataCrawl =
					values.source_type === 'usernames'
						? (values.usernames
								?.split('\n')
								.map((val: string) => val.trim())
								.filter(Boolean) ?? [])
						: values.source_type === 'urls'
							? (values.urls
									?.split('\n')
									.map((val: string) => val.trim())
									.filter(Boolean) ?? [])
							: values.source_type === 'database'
								? (values.account_ids ?? [])
								: values.total_accounts
									? [values.total_accounts]
									: [];

				return await crawlJobAPI.updateCrawlJob(id, {
					source_type: values.source_type,
					data_crawl: dataCrawl,
				});
			}}
			redirectUrl={(result, isEdit, id) => {
				if (!isEdit) {
					const newId = result?.id ?? result?.data?.id;
					return newId ? `/crawler/crawl-job/${newId}` : '/crawler/crawl-job';
				}
				return `/crawler/crawl-job/${id}`;
			}}
		>
			{(ctx) => <CrawlJobFormFields {...ctx} />}
		</ResourceForm>
	);
}
