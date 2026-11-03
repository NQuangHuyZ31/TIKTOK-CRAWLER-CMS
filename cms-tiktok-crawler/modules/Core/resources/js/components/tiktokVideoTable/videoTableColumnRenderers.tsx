import React from 'react';
import { Image, Space, Tag, Typography } from 'antd';
import { CustomerServiceOutlined, EyeOutlined, HeartOutlined, LinkOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { formatNumber } from '../../utils/formatNumber';
import { formatDateTime } from '../../utils/formatDate';
import { formatDuration } from '../../configs/videoTableConfig';

const { Text, Paragraph } = Typography;

export const renderStatWithDelta = (value: number, delta?: number, icon?: React.ReactNode) => (
	<Space size={4}>
		{icon}
		<Text strong>{formatNumber(value ?? 0)}</Text>
		{typeof delta === 'number' && delta !== 0 && (
			<Tag color={delta > 0 ? 'green' : 'volcano'} style={{ margin: 0, fontSize: 11, padding: '0 4px', lineHeight: '18px' }}>
				{delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta)}
			</Tag>
		)}
	</Space>
);

export function buildVideoColumnRenderers({ showDeltas, showAccount, showMusic }: { showDeltas: boolean; showAccount: boolean; showMusic: boolean }) {
	return {
		cover_url: (_: any, record: any) => (
			<div
				style={{
					position: 'relative',
					width: 52,
					height: 68,
					borderRadius: 6,
					overflow: 'hidden',
					backgroundColor: '#000',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{record.cover_url ? (
					<Image
						src={record.cover_url}
						alt="Cover"
						width={52}
						height={68}
						style={{ objectFit: 'cover' }}
						fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='52' height='68' viewBox='0 0 52 68'><rect width='52' height='68' fill='%231f1f1f'/><circle cx='26' cy='34' r='10' fill='%233a3a3a'/></svg>"
					/>
				) : (
					<VideoCameraOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />
				)}
			</div>
		),

		duration: (_: any, record: any) => <Text style={{ fontSize: 12, color: '#595959' }}>{formatDuration(record.duration)}</Text>,

		desc: (_: any, record: any) => (
			<div style={{ maxWidth: 280 }}>
				<Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }} style={{ marginBottom: 4, fontSize: 13, lineHeight: '18px' }}>
					{record.description || record.desc || <Text type="secondary">(no description)</Text>}
				</Paragraph>
				{Array.isArray(record.hashtags) && record.hashtags.length > 0 && (
					<Space size={[0, 2]} wrap style={{ maxWidth: 280 }}>
						{record.hashtags.slice(0, 3).map((tag: string) => (
							<Tag key={tag} style={{ fontSize: 10, lineHeight: '16px', margin: 0, padding: '0 4px' }}>
								#{tag}
							</Tag>
						))}
						{record.hashtags.length > 3 && (
							<Text type="secondary" style={{ fontSize: 10 }}>
								+{record.hashtags.length - 3}
							</Text>
						)}
					</Space>
				)}
			</div>
		),

		author: (_: any, record: any) =>
			showAccount && (
				<a href={`https://www.tiktok.com/@${record.username}`} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
					@{record.username} <LinkOutlined style={{ fontSize: 11 }} />
				</a>
			),

		play_count: (val: number, record: any) => renderStatWithDelta(val, showDeltas ? record.play_count_delta : undefined, <EyeOutlined style={{ color: '#1890ff' }} />),

		digg_count: (val: number, record: any) => renderStatWithDelta(val, showDeltas ? record.digg_count_delta : undefined, <HeartOutlined style={{ color: '#ff4d4f' }} />),

		music: (_: any, record: any) =>
			showMusic && (
				<Space orientation="horizontal" size={4} style={{ maxWidth: 160 }}>
					<CustomerServiceOutlined style={{ color: '#52c41a', fontSize: 12 }} />
					<Text ellipsis style={{ fontSize: 12, maxWidth: 140 }}>
						{record.music_title || 'Original Sound'}
					</Text>
				</Space>
			),

		published_at: (val: string) => <Text style={{ fontSize: 12, color: '#595959' }}>{val ? formatDateTime(val) : '—'}</Text>,
		video_url: (_: any, record: any) => (
			<a href={record.video_url} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
				Watch Video <LinkOutlined style={{ fontSize: 11 }} />
			</a>
		),
	};
}
