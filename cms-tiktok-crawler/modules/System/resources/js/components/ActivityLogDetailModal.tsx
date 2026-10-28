import React from 'react';
import { Card, Col, Descriptions, Modal, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ActivityLogItem } from '../Action/activityLog';

const { Text, Paragraph } = Typography;

interface ActivityLogDetailModalProps {
	open: boolean;
	onClose: () => void;
	activity: ActivityLogItem | null;
}

export default function ActivityLogDetailModal({ open, onClose, activity }: ActivityLogDetailModalProps) {
	if (!activity) return null;

	const isSuccess = activity.status === 'SUCCESS';

	const renderActionTag = (action: string) => {
		const act = action?.toUpperCase();
		if (act === 'CREATE') return <Tag color="green">CREATE</Tag>;
		if (act === 'UPDATE') return <Tag color="blue">UPDATE</Tag>;
		if (act === 'DELETE') return <Tag color="red">DELETE</Tag>;
		if (act === 'LOGIN') return <Tag color="cyan">LOGIN</Tag>;
		if (act === 'LOGOUT') return <Tag color="default">LOGOUT</Tag>;
		if (act === 'CRAWL') return <Tag color="purple">CRAWL</Tag>;
		if (act === 'RETRY_CRAWL') return <Tag color="geekblue">RETRY CRAWL</Tag>;
		if (act === 'PERMISSION_CHANGE') return <Tag color="gold">PERMISSION CHANGE</Tag>;
		if (act === 'ROLE_CHANGE') return <Tag color="magenta">ROLE CHANGE</Tag>;
		return <Tag>{action}</Tag>;
	};

	return (
		<Modal
			title={
				<Space>
					<InfoCircleOutlined style={{ color: '#1677ff' }} />
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
							<Card size="small" title={<Text type="secondary">Previous State (old_data)</Text>} style={{ height: '100%', background: '#fafafa' }}>
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
								style={{ height: '100%', background: '#f6ffed' }}
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
