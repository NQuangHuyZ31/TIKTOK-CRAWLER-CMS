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
		<Card title="Thông tin hồ sơ chi tiết">
			<Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
				<Descriptions.Item label="Mã ID">#{account?.id || '-'}</Descriptions.Item>
				<Descriptions.Item label="Username">@{account?.username || '-'}</Descriptions.Item>
				<Descriptions.Item label="Tên hiển thị (Nickname)">
					{account?.nickname || '-'}
				</Descriptions.Item>

				<Descriptions.Item label="Trạng thái">
					<StatusTag status={account?.status} />
				</Descriptions.Item>
				<Descriptions.Item label="Tích xanh xác minh">
					{account?.is_verified ? (
						<Tag icon={<CheckCircleFilled />} color="blue">
							Đã xác minh
						</Tag>
					) : (
						<Text type="secondary">Chưa xác minh</Text>
					)}
				</Descriptions.Item>
				<Descriptions.Item label="Tổng số video">
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

				<Descriptions.Item label="Thu thập lần đầu">
					{account?.created_at ? formatDateTime(account.created_at) : 'Chưa có'}
				</Descriptions.Item>
				<Descriptions.Item label="Cập nhật lần cuối" span={2}>
					{account?.last_crawled_at ? formatDateTime(account.last_crawled_at) : 'Chưa từng cào'}
				</Descriptions.Item>

				<Descriptions.Item label="Đường dẫn TikTok" span={3}>
					{account?.profile_url ? (
						<a href={account.profile_url} target="_blank" rel="noopener noreferrer">
							{account.profile_url}
						</a>
					) : (
						'-'
					)}
				</Descriptions.Item>

				{account?.bio && (
					<Descriptions.Item label="Tiểu sử (Bio)" span={3}>
						<Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{account.bio}</Paragraph>
					</Descriptions.Item>
				)}
			</Descriptions>
		</Card>
	);
}
