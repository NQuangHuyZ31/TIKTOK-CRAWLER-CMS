import React from 'react';
import { Card, Descriptions, Tag, Typography } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import StatusTag from '@core/components/StatusTag';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';

const { Text, Paragraph } = Typography;

interface AccountInfoTabProps {
	account: any;
}

export default function AccountInfoTab({ account }: AccountInfoTabProps) {
	return (
		<Card title="Account Profile Details">
			<Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
				<Descriptions.Item label="ID">#{account?.id || '-'}</Descriptions.Item>
				<Descriptions.Item label="Username">@{account?.username || '-'}</Descriptions.Item>
				<Descriptions.Item label="Nickname">
					{account?.nickname || '-'}
				</Descriptions.Item>

				<Descriptions.Item label="Status">
					<StatusTag status={account?.status} />
				</Descriptions.Item>
				<Descriptions.Item label="Verification">
					{account?.is_verified ? (
						<Tag icon={<CheckCircleFilled />} color="blue">
							Verified
						</Tag>
					) : (
						<Text type="secondary">Unverified</Text>
					)}
				</Descriptions.Item>
				<Descriptions.Item label="Total Videos">
					{formatNumber(account?.video_count || 0)}
				</Descriptions.Item>

				<Descriptions.Item label="Sec UID" span={3}>
					{account?.sec_uid ? (
						<Text copyable style={{ fontFamily: 'monospace' }}>
							{account.sec_uid}
						</Text>
					) : (
						'-'
					)}
				</Descriptions.Item>

				<Descriptions.Item label="First Crawled">
					{account?.created_at ? formatDateTime(account.created_at) : 'None'}
				</Descriptions.Item>
				<Descriptions.Item label="Last Crawled" span={2}>
					{account?.last_crawled_at ? formatDateTime(account.last_crawled_at) : 'Never'}
				</Descriptions.Item>

				<Descriptions.Item label="TikTok Profile URL" span={3}>
					{account?.profile_url ? (
						<a href={account.profile_url} target="_blank" rel="noopener noreferrer">
							{account.profile_url}
						</a>
					) : (
						'-'
					)}
				</Descriptions.Item>

				{account?.bio && (
					<Descriptions.Item label="Bio" span={3}>
						<Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{account.bio}</Paragraph>
					</Descriptions.Item>
				)}
			</Descriptions>
		</Card>
	);
}
