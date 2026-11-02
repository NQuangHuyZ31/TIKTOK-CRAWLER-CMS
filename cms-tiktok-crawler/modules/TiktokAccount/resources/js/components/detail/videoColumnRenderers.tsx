import React from 'react';
import { Button, Flex, Image, Space, Tag, Typography } from 'antd';
import {
	CustomerServiceOutlined,
	EyeOutlined,
	HeartOutlined,
	LinkOutlined,
} from '@ant-design/icons';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';

const { Text, Paragraph } = Typography;

export const formatDuration = (seconds?: number): string => {
	if (!seconds || seconds <= 0) return '-';
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const createAccountVideoColumnRenderers = () => ({
	cover_url: (val: string, record: any) => (
		<Image
			width={64}
			height={85}
			src={val || record.dynamic_cover_url}
			style={{ objectFit: 'cover', borderRadius: 4 }}
			fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='85' fill='%23ccc'><rect width='100%' height='100%'/></svg>"
		/>
	),
	description: (val: string, record: any) => {
		const tags = Array.isArray(record.hashtags) ? record.hashtags : [];
		return (
			<Space orientation="vertical" size={4} style={{ width: '100%', maxWidth: 360 }}>
				<Paragraph
					ellipsis={{ rows: 2, expandable: true, symbol: 'Thêm' }}
					style={{ margin: 0, fontSize: 13 }}
				>
					{val || '(Không có mô tả)'}
				</Paragraph>
				{tags.length > 0 && (
					<Flex wrap="wrap" gap={4}>
						{tags.slice(0, 4).map((tag: string, idx: number) => (
							<Tag key={idx} color="blue" style={{ fontSize: 11, margin: 0 }}>
								#{tag}
							</Tag>
						))}
						{tags.length > 4 && (
							<Tag style={{ fontSize: 11, margin: 0 }}>+{tags.length - 4}</Tag>
						)}
					</Flex>
				)}
			</Space>
		);
	},
	duration: (val: number) => (
		<Tag color="default" style={{ fontFamily: 'monospace' }}>
			{formatDuration(val)}
		</Tag>
	),
	play_count: (val: any) => (
		<Space size={4}>
			<EyeOutlined style={{ color: '#1677ff' }} />
			<Text strong>{formatNumber(val ?? 0)}</Text>
		</Space>
	),
	digg_count: (val: any) => (
		<Space size={4}>
			<HeartOutlined style={{ color: '#fa8c16' }} />
			<Text>{formatNumber(val ?? 0)}</Text>
		</Space>
	),
	comment_count: (val: any) => formatNumber(val ?? 0),
	share_count: (val: any) => formatNumber(val ?? 0),
	music_title: (val: string, record: any) =>
		val ? (
			<Space size={6} style={{ maxWidth: 170 }}>
				<CustomerServiceOutlined style={{ color: '#722ed1', flexShrink: 0 }} />
				<Text ellipsis={{ tooltip: `${val} - ${record.music_author || ''}` }} style={{ fontSize: 12 }}>
					{val}
				</Text>
			</Space>
		) : (
			<Text type="secondary">-</Text>
		),
	published_at: (val: any) => (
		<Text type="secondary" style={{ fontSize: 12 }}>
			{val ? formatDateTime(val) : '-'}
		</Text>
	),
	video_url: (val: string) =>
		val ? (
			<Button
				type="link"
				size="small"
				icon={<LinkOutlined />}
				href={val}
				target="_blank"
				rel="noopener noreferrer"
			>
				Xem
			</Button>
		) : (
			'-'
		),
});
