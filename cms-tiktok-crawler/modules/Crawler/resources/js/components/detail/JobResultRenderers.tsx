import React from 'react';
import { Avatar, Button, Typography } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import StatusTag from '@core/components/StatusTag';
import { formatNumber } from '@core/utils/formatNumber';
import { formatDateTime } from '@core/utils/formatDate';
import { renderStatWithDelta } from '@core/components/TiktokVideoTable';

export { renderStatWithDelta } from '@core/components/TiktokVideoTable';

export const createAccountColumnRenderers = (onSelectUserVideos: (username: string) => void) => ({
	avatar_path: (val: any) => <Avatar size={40} src={val || undefined} icon={<UserOutlined />} />,
	username: (val: any) => (val ? <span style={{ fontWeight: 500 }}>@{val}</span> : '-'),
	status: (status: any) => <StatusTag status={status} />,
	followers_count: (val: any) => formatNumber(val),
	following_count: (val: any) => formatNumber(val),
	likes_count: (val: any) => formatNumber(val),
	videos_crawled_count: (val: any, record: any) => (
		<Button
			type="link"
			size="small"
			onClick={() => onSelectUserVideos(record.username)}
		>
			<VideoCameraOutlined /> {formatNumber(val ?? 0)}
		</Button>
	),
	crawled_at: (val: any) => formatDateTime(val),
	profile_url: (text: string) =>
		text ? (
			<Link to={text} target="_blank" rel="noopener noreferrer">
				{text}
			</Link>
		) : (
			'-'
		),
});

export const createVideoColumnRenderers = () => ({
	cover_url: (val: any) => <Avatar shape="square" size={44} src={val || undefined} icon={<VideoCameraOutlined />} />,
	video_id: (val: any) => <Typography.Text code>{val}</Typography.Text>,
	username: (val: any) => (val ? <span style={{ fontWeight: 500 }}>@{val}</span> : '-'),
	description: (val: any) => (
		<Typography.Paragraph ellipsis={{ rows: 2, tooltip: val }} style={{ marginBottom: 0 }}>
			{val || '-'}
		</Typography.Paragraph>
	),
	play_count: (val: any, record: any) => renderStatWithDelta(val, record.play_count_delta),
	digg_count: (val: any, record: any) => renderStatWithDelta(val, record.digg_count_delta),
	comment_count: (val: any, record: any) => renderStatWithDelta(val, record.comment_count_delta),
	share_count: (val: any, record: any) => renderStatWithDelta(val, record.share_count_delta),
	collect_count: (val: any, record: any) => renderStatWithDelta(val, record.collect_count_delta),
	published_at: (val: any) => formatDateTime(val) || '-',
	video_url: (text: string) =>
		text ? (
			<Link to={text} target="_blank" rel="noopener noreferrer">
				Watch Video
			</Link>
		) : (
			'-'
		),
});

