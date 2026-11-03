import React, { useEffect, useState } from 'react';
import { Card, Form, Tabs, message } from 'antd';
import { HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import ListLayout from '@core/components/ListLayout';
import { useAction } from '@core/hooks/useAction';
import { useDispatch, useSelector } from '@core/store';
import { fetchWorkerSettings, saveWorkerSettings, fetchCleanupHistory } from '../store/system/systemThunks';
import { runLogCleanup } from '../Action/systemSetting';
import SystemSettingsKpis from '../components/systemSettings/SystemSettingsKpis';
import WorkerSettingsForm, { CRON_PRESET_OPTIONS } from '../components/systemSettings/WorkerSettingsForm';
import CleanupHistoryTable from '../components/systemSettings/CleanupHistoryTable';

export default function SystemSettingsPage() {
	const dispatch = useDispatch();
	const { workerSettings, settingsLoading, settingsSaving, cleanupHistory } = useSelector((state) => state.system);

	const [form] = Form.useForm();
	const [activeTab, setActiveTab] = useState('worker');
	const [selectedPreset, setSelectedPreset] = useState('daily_02_00');

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

	return (
		<ListLayout
			title="System Settings"
			subtitle="Manage dynamic background workers, log retention policies, and automated maintenance tasks"
			breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'System', href: '/admin/system' }, { title: 'Settings' }]}
			onRefresh={loadData}
			refreshing={settingsLoading}
		>
			<SystemSettingsKpis workerSettings={workerSettings} loading={settingsLoading} />

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
								<WorkerSettingsForm
									form={form}
									selectedPreset={selectedPreset}
									onPresetChange={handlePresetChange}
									onSave={handleSaveSettings}
									onRunManualCleanup={handleRunManualCleanup}
									settingsLoading={settingsLoading}
									settingsSaving={settingsSaving}
									cleanupLoading={cleanupLoading}
								/>
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
								<CleanupHistoryTable
									cleanupHistory={cleanupHistory}
									loading={settingsLoading}
									onRefresh={() => dispatch(fetchCleanupHistory())}
								/>
							),
						},
					]}
				/>
			</Card>
		</ListLayout>
	);
}
