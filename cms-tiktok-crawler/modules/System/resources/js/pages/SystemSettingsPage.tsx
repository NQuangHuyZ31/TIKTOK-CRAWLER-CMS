import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Divider, Flex, Form, Input, InputNumber, Popconfirm, Row, Select, Space, Switch, Tabs, Typography, message } from 'antd';
import { CheckCircleOutlined, ClearOutlined, ClockCircleOutlined, HistoryOutlined, SafetyCertificateOutlined, SaveOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import ListLayout from '@core/components/ListLayout';
import CardKPI from '@core/components/CardKPI';
import TableComponent, { TableColumn } from '@core/components/Table';
import StatusTag from '@core/components/StatusTag';
import { useAction } from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { fetchWorkerSettings, saveWorkerSettings, fetchCleanupHistory } from '../store/system/systemThunks';
import { runLogCleanup, CleanupHistoryItem } from '../Action/systemSetting';

const { Text, Paragraph, Title } = Typography;

const CRON_PRESET_OPTIONS = [
	{ label: 'Daily at 02:00 AM (0 2 * * *)', value: 'daily_02_00', cron: '0 2 * * *' },
	{ label: 'Daily at Midnight (0 0 * * *)', value: 'daily_00_00', cron: '0 0 * * *' },
	{ label: 'Weekly on Sunday at 03:00 AM (0 3 * * 0)', value: 'weekly_sun', cron: '0 3 * * 0' },
	{ label: 'Custom Cron Expression', value: 'custom', cron: '' },
];

export default function SystemSettingsPage() {
	const dispatch = useDispatch();
	const { workerSettings, settingsLoading, settingsSaving, cleanupHistory } = useSelector((state) => state.system);

	const [form] = Form.useForm();
	const [activeTab, setActiveTab] = useState('worker');
	const [selectedPreset, setSelectedPreset] = useState('daily_02_00');

	// Hook to trigger manual on-demand pruning
	const { act: executeCleanup, loading: cleanupLoading } = useAction((params: { activity_days?: number; login_days?: number }) => runLogCleanup(params), {
		successMessage: (res) => res?.message || `Cleanup completed! Purged ${res?.data?.total_purged ?? 0} records in ${res?.data?.duration_sec ?? 0}s.`,
		onSuccess: () => {
			dispatch(fetchWorkerSettings('worker'));
			dispatch(fetchCleanupHistory());
		},
	});

	const loadData = () => {
		dispatch(fetchWorkerSettings('worker'));
		dispatch(fetchCleanupHistory());
	};

	useEffect(() => {
		loadData();
	}, [dispatch]);

	// Sync form fields when workerSettings is fetched
	useEffect(() => {
		if (workerSettings) {
			setSelectedPreset(workerSettings.cleanup_schedule_preset || 'daily_02_00');
			form.setFieldsValue({
				auto_cleanup_enabled: workerSettings.auto_cleanup_enabled ?? true,
				cleanup_schedule_preset: workerSettings.cleanup_schedule_preset || 'daily_02_00',
				cleanup_schedule_cron: workerSettings.cleanup_schedule_cron || '0 2 * * *',
				activity_log_retention_days: workerSettings.activity_log_retention_days || 30,
				login_log_retention_days: workerSettings.login_log_retention_days || 60,
				cleanup_chunk_size: workerSettings.cleanup_chunk_size || 500,
				cleanup_sleep_between_batches_ms: workerSettings.cleanup_sleep_between_batches_ms || 100,
			});
		}
	}, [workerSettings, form]);

	const handlePresetChange = (value: string) => {
		setSelectedPreset(value);
		const match = CRON_PRESET_OPTIONS.find((item) => item.value === value);
		if (match && match.cron) {
			form.setFieldValue('cleanup_schedule_cron', match.cron);
		}
	};

	const handleSaveSettings = async (values: any) => {
		try {
			await dispatch(
				saveWorkerSettings({
					group: 'worker',
					settings: {
						auto_cleanup_enabled: values.auto_cleanup_enabled,
						cleanup_schedule_preset: values.cleanup_schedule_preset,
						cleanup_schedule_cron: values.cleanup_schedule_cron,
						activity_log_retention_days: Number(values.activity_log_retention_days),
						login_log_retention_days: Number(values.login_log_retention_days),
						cleanup_chunk_size: Number(values.cleanup_chunk_size),
						cleanup_sleep_between_batches_ms: Number(values.cleanup_sleep_between_batches_ms),
					},
				}),
			).unwrap();
			message.success('Worker and log retention settings updated successfully.');
			loadData();
		} catch (err: any) {
			message.error(err?.message || 'Failed to update system settings.');
		}
	};

	const handleRunManualCleanup = () => {
		const actDays = form.getFieldValue('activity_log_retention_days') || 30;
		const loginDays = form.getFieldValue('login_log_retention_days') || 60;
		executeCleanup({ activity_days: actDays, login_days: loginDays });
	};

	// Columns for History Table
	const historyColumns: TableColumn<CleanupHistoryItem>[] = [
		{
			title: 'Execution Time',
			dataIndex: 'executed_at',
			key: 'executed_at',
			width: 180,
			render: (val: string) => <Text strong>{val || 'N/A'}</Text>,
		},
		{
			title: 'Trigger',
			dataIndex: 'trigger',
			key: 'trigger',
			width: 140,
			render: (val: string) => {
				const isAuto = val === 'scheduled';
				return <StatusTag status={isAuto ? 'active' : 'info'} label={isAuto ? 'Scheduled' : val === 'artisan_cli' ? 'Artisan CLI' : 'Manual Admin'} />;
			},
		},
		{
			title: 'Status',
			dataIndex: 'status',
			key: 'status',
			width: 110,
			render: (val: string) => <StatusTag status={val === 'success' ? 'success' : val === 'running' ? 'pending' : 'failed'} label={val} />,
		},
		{
			title: 'Total Purged',
			dataIndex: 'purged_count',
			key: 'purged_count',
			width: 130,
			render: (val: number) => <Text style={{ color: '#1677ff', fontWeight: 600 }}>{val?.toLocaleString() ?? 0} rows</Text>,
		},
		{
			title: 'Activity Logs',
			dataIndex: 'activity_logs_purged',
			key: 'activity_logs_purged',
			width: 120,
			render: (val: number) => `${val?.toLocaleString() ?? 0} rows`,
		},
		{
			title: 'Login Logs',
			dataIndex: 'login_logs_purged',
			key: 'login_logs_purged',
			width: 120,
			render: (val: number) => `${val?.toLocaleString() ?? 0} rows`,
		},
		{
			title: 'Duration',
			dataIndex: 'duration_sec',
			key: 'duration_sec',
			width: 110,
			render: (val: number) => `${val ?? 0}s`,
		},
		{
			title: 'Details / Error',
			dataIndex: 'error_message',
			key: 'error_message',
			render: (val: string | null) => (val ? <Text type="danger">{val}</Text> : <Text type="secondary">Completed without errors</Text>),
		},
	];

	return (
		<ListLayout
			title="System Settings"
			subtitle="Manage dynamic background workers, log retention policies, and automated maintenance tasks"
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'System', href: '/admin/system' }, { title: 'Settings' }]}
			onRefresh={loadData}
			refreshing={settingsLoading}
		>
			{/* Top KPI Summary */}
			<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
				<Col xs={24} sm={12} md={8}>
					<CardKPI
						title="Worker Status"
						value={workerSettings?.auto_cleanup_enabled ? 'Active' : 'Disabled'}
						color={workerSettings?.auto_cleanup_enabled ? '#52c41a' : '#faad14'}
						icon={workerSettings?.auto_cleanup_enabled ? <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} /> : <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />}
						subtext={`Cron Schedule: ${workerSettings?.cleanup_schedule_cron || '0 2 * * *'}`}
						loading={settingsLoading}
					/>
				</Col>
				<Col xs={24} sm={12} md={8}>
					<CardKPI
						title="Retention Policies"
						value={`${workerSettings?.activity_log_retention_days || 30}d / ${workerSettings?.login_log_retention_days || 60}d`}
						color="#1677ff"
						icon={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
						subtext="Activity (min: 7d) & Login (min: 14d) retention"
						loading={settingsLoading}
					/>
				</Col>
				<Col xs={24} sm={12} md={8}>
					<CardKPI
						title="Last Cleanup Result"
						value={`${workerSettings?.last_cleanup_purged_count || 0} purged`}
						color="#722ed1"
						icon={<SyncOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
						subtext={workerSettings?.last_cleanup_at ? `Run: ${workerSettings.last_cleanup_at} (${workerSettings.last_cleanup_duration_sec || 0}s)` : 'Never executed yet'}
						loading={settingsLoading}
					/>
				</Col>
			</Row>

			<Card styles={{ body: { padding: '16px 24px' } }} style={{ border: '1px solid #edf0f5', borderRadius: 8 }}>
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: 'worker',
							label: (
								<span>
									<SettingOutlined /> Worker & Retention Settings
								</span>
							),
							children: (
								<Row gutter={[24, 24]}>
									<Col xs={24} lg={15}>
										<Form form={form} layout="vertical" onFinish={handleSaveSettings} disabled={settingsLoading}>
											<Title level={5}>Scheduled Log Pruning Worker</Title>
											<Paragraph type="secondary">Configure the automated background cron evaluation to safely prune aged activity and login records.</Paragraph>

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
														<Select options={CRON_PRESET_OPTIONS} onChange={handlePresetChange} />
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
											<Paragraph type="secondary">Specify the maximum age of logs to preserve. Records older than the configured threshold are purged in safe micro-batches.</Paragraph>

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
											<Paragraph>Need to reclaim database storage immediately? Run a manual cleanup pass right now.</Paragraph>
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
													onConfirm={handleRunManualCleanup}
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
							),
						},
						{
							key: 'history',
							label: (
								<span>
									<HistoryOutlined /> Execution History
								</span>
							),
							children: (
								<div>
									<Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
										<div>
											<Title level={5} style={{ margin: 0 }}>
												Recent Cleanup Logs
											</Title>
											<Text type="secondary">Audit records of the last 10 scheduled and manual pruning runs.</Text>
										</div>
										<Button icon={<SyncOutlined />} onClick={() => dispatch(fetchCleanupHistory())}>
											Refresh History
										</Button>
									</Flex>
									<TableComponent<CleanupHistoryItem> columns={historyColumns} data={cleanupHistory || []} rowKey="id" pagination={false} loading={settingsLoading} />
								</div>
							),
						},
					]}
				/>
			</Card>
		</ListLayout>
	);
}
