import React from 'react';
import { Card, Col, Descriptions, Modal, Row, Space, Tag, Typography, theme } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getActivityActionConfig } from '../configs/activityLogConfig';
import type { ActivityLogItem } from '../Action/activityLog';

const { Text, Paragraph } = Typography;

interface ActivityLogDetailModalProps {
	open: boolean;
	onClose: () => void;
	activity: ActivityLogItem | null;
}

export default function ActivityLogDetailModal({ open, onClose, activity }: ActivityLogDetailModalProps) {
	const { token } = theme.useToken();

	if (!activity) return null;

	const isSuccess = activity.status === 'SUCCESS';

	const renderActionTag = (action: string) => {
		const config = getActivityActionConfig(action);
		return <Tag color={config.color}>{config.label}</Tag>;
	};

	return (
		<Modal
			title={
				<Space>
					<InfoCircleOutlined style={{ color: token.colorPrimary }} />
					<span>Activity Log Details #{activity.id}</span>
				</Space>
			}
			open={open}
			onCancel={onClose}
			footer={null}
			width={840}
			destroyOnClose
		>
			<Space direction="vertical" size={16} style={{ width: '100%', marginTop: 12 }}>
				<Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
					<Descriptions.Item label="Actor Email">
						<Text strong>{activity.user_email}</Text>
					</Descriptions.Item>
					<Descriptions.Item label="Actor Role">
						<Tag color="geekblue">{activity.user_role || 'SYSTEM'}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Action">{renderActionTag(activity.action)}</Descriptions.Item>
					<Descriptions.Item label="Module">
						<Tag color="purple">{activity.module}</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Target Record">
						<Space>
							<Text code>{activity.record_id || 'N/A'}</Text>
							{activity.record_type && <Text type="secondary">({activity.record_type})</Text>}
						</Space>
					</Descriptions.Item>
					<Descriptions.Item label="Execution Status">
						<Tag color={isSuccess ? 'success' : 'error'} icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
							{activity.status}
						</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="Timestamp" span={2}>
						<Text>{activity.created_at ? new Date(activity.created_at).toLocaleString() : '-'}</Text>
					</Descriptions.Item>
					{activity.error_message && (
						<Descriptions.Item label="Error Message" span={2}>
							<Text type="danger">{activity.error_message}</Text>
						</Descriptions.Item>
					)}
				</Descriptions>

				{/* Changes Data: Old vs New */}
				{(activity.old_data || activity.new_data) && (
					<Row gutter={[16, 16]}>
						<Col span={12}>
							<Card size="small" title={<Text type="secondary">Previous State (old_data)</Text>} style={{ height: '100%', background: token.colorFillAlter }}>
								{activity.old_data ? (
									<Paragraph style={{ margin: 0 }}>
										<pre style={{ margin: 0, fontSize: 12, maxHeight: 220, overflow: 'auto' }}>{JSON.stringify(activity.old_data, null, 2)}</pre>
									</Paragraph>
								) : (
									<Text type="secondary" italic>
										No previous snapshot
									</Text>
								)}
							</Card>
						</Col>
						<Col span={12}>
							<Card
								size="small"
								title={
									<Text strong style={{ color: '#52c41a' }}>
										Modified State (new_data)
									</Text>
								}
								style={{ height: '100%', background: token.colorSuccessBg }}
							>
								{activity.new_data ? (
									<Paragraph style={{ margin: 0 }}>
										<pre style={{ margin: 0, fontSize: 12, maxHeight: 220, overflow: 'auto' }}>{JSON.stringify(activity.new_data, null, 2)}</pre>
									</Paragraph>
								) : (
									<Text type="secondary" italic>
										No new snapshot
									</Text>
								)}
							</Card>
						</Col>
					</Row>
				)}

				{/* Metadata */}
				{activity.metadata && (
					<Card size="small" title="Request & Environmental Context (metadata)">
						<pre style={{ margin: 0, fontSize: 12, maxHeight: 150, overflow: 'auto' }}>{JSON.stringify(activity.metadata, null, 2)}</pre>
					</Card>
				)}
			</Space>
		</Modal>
	);
}
