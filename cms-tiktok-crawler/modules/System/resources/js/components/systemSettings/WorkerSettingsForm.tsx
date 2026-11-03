import React from 'react';
import { Form, Row, Col, Typography, Switch, Select, Input, InputNumber, Button, Divider, Card, Alert, Space, Popconfirm } from 'antd';
import { SaveOutlined, ClearOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

const { Title, Paragraph: AntParagraph } = Typography;

export const CRON_PRESET_OPTIONS = [
	{ label: 'Daily at 02:00 AM (0 2 * * *)', value: 'daily_02_00', cron: '0 2 * * *' },
	{ label: 'Daily at Midnight (0 0 * * *)', value: 'daily_00_00', cron: '0 0 * * *' },
	{ label: 'Weekly on Sunday at 03:00 AM (0 3 * * 0)', value: 'weekly_sun', cron: '0 3 * * 0' },
	{ label: 'Custom Cron Expression', value: 'custom', cron: '' },
];

export interface WorkerSettingsFormProps {
	form: FormInstance;
	selectedPreset: string;
	onPresetChange: (value: string) => void;
	onSave: (values: any) => void;
	onRunManualCleanup: () => void;
	settingsLoading: boolean;
	settingsSaving: boolean;
	cleanupLoading: boolean;
}

export default function WorkerSettingsForm({
	form,
	selectedPreset,
	onPresetChange,
	onSave,
	onRunManualCleanup,
	settingsLoading,
	settingsSaving,
	cleanupLoading,
}: WorkerSettingsFormProps) {
	return (
		<Row gutter={[24, 24]}>
			<Col xs={24} lg={15}>
				<Form form={form} layout="vertical" onFinish={onSave} disabled={settingsLoading}>
					<Title level={5}>Scheduled Log Pruning Worker</Title>
					<AntParagraph type="secondary">Configure the automated background cron evaluation to safely prune aged activity and login records.</AntParagraph>

					<Form.Item
						label="Automated Pruning Status"
						name="auto_cleanup_enabled"
						valuePropName="checked"
						help="When disabled, periodic worker tasks are skipped without affecting manual execution."
					>
						<Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
					</Form.Item>

					<Row gutter={16}>
						<Col xs={24} md={12}>
							<Form.Item label="Schedule Frequency Preset" name="cleanup_schedule_preset" rules={[{ required: true }]}>
								<Select options={CRON_PRESET_OPTIONS} onChange={onPresetChange} />
							</Form.Item>
						</Col>
						<Col xs={24} md={12}>
							<Form.Item
								label="Cron Expression"
								name="cleanup_schedule_cron"
								rules={[{ required: true, message: 'Cron expression is required' }]}
								help="Standard 5-field cron syntax evaluated dynamically every minute."
							>
								<Input placeholder="0 2 * * *" disabled={selectedPreset !== 'custom'} />
							</Form.Item>
						</Col>
					</Row>

					<Divider />
					<Title level={5}>Data Retention Policies</Title>
					<AntParagraph type="secondary">Specify the maximum age of logs to preserve. Records older than the configured threshold are purged in safe micro-batches.</AntParagraph>

					<Row gutter={16}>
						<Col xs={24} md={12}>
							<Form.Item label="Activity Log Retention Period" name="activity_log_retention_days" rules={[{ required: true }]} help="Safety floor enforced: Minimum 7 days.">
								<InputNumber min={7} max={365} addonAfter="days" style={{ width: '100%' }} />
							</Form.Item>
						</Col>
						<Col xs={24} md={12}>
							<Form.Item label="Login Log Retention Period" name="login_log_retention_days" rules={[{ required: true }]} help="Safety floor enforced: Minimum 14 days.">
								<InputNumber min={14} max={730} addonAfter="days" style={{ width: '100%' }} />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col xs={24} md={12}>
							<Form.Item label="Chunk Batch Size" name="cleanup_chunk_size" rules={[{ required: true }]} help="Limits records deleted per SQL statement to avoid table locks.">
								<InputNumber min={50} max={5000} addonAfter="records/chunk" style={{ width: '100%' }} />
							</Form.Item>
						</Col>
						<Col xs={24} md={12}>
							<Form.Item
								label="Yield Micro-Sleep Between Batches"
								name="cleanup_sleep_between_batches_ms"
								rules={[{ required: true }]}
								help="Pauses execution briefly (ms) between batches to yield CPU/IO."
							>
								<InputNumber min={0} max={2000} addonAfter="ms" style={{ width: '100%' }} />
							</Form.Item>
						</Col>
					</Row>

					<Form.Item style={{ marginTop: 16 }}>
						<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={settingsSaving}>
							Save Settings
						</Button>
					</Form.Item>
				</Form>
			</Col>

			<Col xs={24} lg={9}>
				<Card
					title="On-Demand Maintenance"
					style={{
						background: '#fafcff',
						borderColor: '#d6e4ff',
						borderRadius: 8,
					}}
				>
					<AntParagraph>Need to reclaim database storage immediately? Run a manual cleanup pass right now.</AntParagraph>
					<Alert
						type="info"
						showIcon
						message="Safe Batch Deletion"
						description="The cleanup job iterates in chunks of 500 records and respects configured retention days without interrupting CMS operations."
						style={{ marginBottom: 16 }}
					/>

					<Space direction="vertical" style={{ width: '100%' }}>
						<Popconfirm
							title="Trigger Log Pruning Now"
							description="Are you sure you want to prune logs older than retention period? This action cannot be undone."
							onConfirm={onRunManualCleanup}
							okText="Yes, Prune Now"
							cancelText="Cancel"
						>
							<Button danger type="primary" icon={<ClearOutlined />} loading={cleanupLoading} block>
								Run Cleanup Now
							</Button>
						</Popconfirm>
					</Space>
				</Card>
			</Col>
		</Row>
	);
}
