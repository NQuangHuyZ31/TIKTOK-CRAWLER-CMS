import React from 'react';
import { Row, Col } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SafetyCertificateOutlined, SyncOutlined } from '@ant-design/icons';
import CardKPI from '@core/components/CardKPI';
import type { WorkerSettings } from '../../Action/systemSetting';

export interface SystemSettingsKpisProps {
	workerSettings: WorkerSettings | null;
	loading?: boolean;
}

export default function SystemSettingsKpis({ workerSettings, loading = false }: SystemSettingsKpisProps) {
	return (
		<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
			<Col xs={24} sm={12} md={8}>
				<CardKPI
					title="Worker Status"
					value={workerSettings?.auto_cleanup_enabled ? 'Active' : 'Disabled'}
					color={workerSettings?.auto_cleanup_enabled ? '#52c41a' : '#faad14'}
					icon={workerSettings?.auto_cleanup_enabled ? <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} /> : <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />}
					subtext={`Cron Schedule: ${workerSettings?.cleanup_schedule_cron || '0 2 * * *'}`}
					loading={loading}
				/>
			</Col>
			<Col xs={24} sm={12} md={8}>
				<CardKPI
					title="Retention Policies"
					value={`${workerSettings?.activity_log_retention_days || 30}d / ${workerSettings?.login_log_retention_days || 60}d`}
					color="#1677ff"
					icon={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
					subtext="Activity (min: 7d) & Login (min: 14d) retention"
					loading={loading}
				/>
			</Col>
			<Col xs={24} sm={12} md={8}>
				<CardKPI
					title="Last Cleanup Result"
					value={`${workerSettings?.last_cleanup_purged_count || 0} purged`}
					color="#722ed1"
					icon={<SyncOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
					subtext={workerSettings?.last_cleanup_at ? `Run: ${workerSettings.last_cleanup_at} (${workerSettings.last_cleanup_duration_sec || 0}s)` : 'Never executed yet'}
					loading={loading}
				/>
			</Col>
		</Row>
	);
}
