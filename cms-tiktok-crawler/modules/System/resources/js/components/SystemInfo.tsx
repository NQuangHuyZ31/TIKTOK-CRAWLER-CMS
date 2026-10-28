import { Badge, Button, Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import { CloudServerOutlined, DashboardOutlined, DatabaseOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import CardKPI from '@core/components/CardKPI';
import type { SystemInfoData } from '../Action/systemDiagnostic';

const { Text } = Typography;

export interface SystemInfoTabProps {
	info: SystemInfoData | null;
	loading?: boolean;
	onRefresh: () => void;
}

export default function SystemInfo({ info, loading = false, onRefresh }: SystemInfoTabProps) {
	return (
		<Space direction="vertical" size={20} style={{ width: '100%' }}>
			<Row gutter={[16, 16]}>
				<Col span={24} sm={12} lg={6}>
					<CardKPI title="PHP Runtime" value={info?.php_version ?? '8.3+'} icon={<ThunderboltOutlined />} color="#722ed1" subtext="Zend Engine Architecture" loading={loading} />
				</Col>

				<Col span={24} sm={12} lg={6}>
					<CardKPI title="Laravel Framework" value={`v${info?.laravel_version ?? '13'}`} icon={<CloudServerOutlined />} color="#ff4d4f" subtext="Modular Monolith Framework" loading={loading} />
				</Col>

				<Col span={24} sm={12} lg={6}>
					<CardKPI
						title="Database Status"
						value={info?.database_connected ? 'Connected' : 'Offline'}
						icon={<DatabaseOutlined />}
						color={info?.database_connected ? '#52c41a' : '#faad14'}
						subtext={`Driver: ${info?.database_driver?.toUpperCase() ?? 'MYSQL'}`}
						loading={loading}
					/>
				</Col>

				<Col span={24} sm={12} lg={6}>
					<CardKPI title="Memory In Use" value={`${info?.memory_usage_mb ?? 0} MB`} icon={<DashboardOutlined />} color="#1677ff" subtext={`Limit: ${info?.memory_limit ?? 'N/A'}`} loading={loading} />
				</Col>
			</Row>

			<Card
				title={
					<Space style={{ width: '100%', justifyContent: 'space-between' }}>
						<Space>
							<CloudServerOutlined style={{ color: '#1677ff' }} />
							<Text strong>Environment & System Runtime Details</Text>
						</Space>
						<Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} size="small">
							Refresh Diagnostics
						</Button>
					</Space>
				}
			>
				<Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }}>
					<Descriptions.Item label="Application Name">
						<Text strong>{info?.app_name ?? 'CMS TikTok Crawler'}</Text>
					</Descriptions.Item>

					<Descriptions.Item label="Environment">
						<Tag color={info?.app_env === 'production' ? 'red' : 'blue'}>{info?.app_env?.toUpperCase() ?? 'LOCAL'}</Tag>
					</Descriptions.Item>

					<Descriptions.Item label="Debug Mode">
						<Badge status={info?.app_debug ? 'warning' : 'success'} text={info?.app_debug ? 'Enabled (Verbose)' : 'Disabled'} />
					</Descriptions.Item>

					<Descriptions.Item label="Operating System">
						<Text>{info?.server_os ?? 'Windows'}</Text>
					</Descriptions.Item>

					<Descriptions.Item label="Server Local Time">
						<Text style={{ fontFamily: 'monospace' }}>{info?.server_time ? new Date(info.server_time).toLocaleString() : '-'}</Text>
					</Descriptions.Item>

					<Descriptions.Item label="Timezone">
						<Tag color="cyan">{info?.timezone ?? 'UTC'}</Tag>
					</Descriptions.Item>

					<Descriptions.Item label="Max Execution Time">
						<Text>{info?.max_execution_time ?? '30s'}</Text>
					</Descriptions.Item>

					<Descriptions.Item label="Base URL">
						<Text copyable style={{ fontSize: 12 }}>
							{info?.app_url ?? 'http://localhost'}
						</Text>
					</Descriptions.Item>

					<Descriptions.Item label="Modular Engine">
						<Tag color="purple">Ureka Modular Architecture</Tag>
					</Descriptions.Item>
				</Descriptions>
			</Card>
		</Space>
	);
}
