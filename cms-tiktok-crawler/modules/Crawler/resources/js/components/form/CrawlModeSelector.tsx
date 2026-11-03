import React, { useMemo } from 'react';
import { Card, Form, Input, Row, Space, Typography, theme } from 'antd';
import { CompassOutlined, LinkOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import VideoLimitSlider from './VideoLimitSlider';
import CrawlModeOptionCard, { CrawlModeOptionCardProps } from './CrawlModeOptionCard';

const { Text } = Typography;

interface CrawlModeSelectorProps {
	crawlMode: 'account_with_videos' | 'account_only' | 'video_only';
	maxVideos: number;
	isReadOnly: boolean;
	onSelectMode: (mode: 'account_with_videos' | 'account_only' | 'video_only') => void;
	onSelectMaxVideosPreset: (val: number) => void;
}

export default function CrawlModeSelector({
	crawlMode,
	maxVideos,
	isReadOnly,
	onSelectMode,
	onSelectMaxVideosPreset,
}: CrawlModeSelectorProps) {
	const { token } = theme.useToken();

	const modeConfigs: Omit<CrawlModeOptionCardProps, 'selected' | 'isReadOnly' | 'onSelect'>[] = useMemo(() => [
		{
			mode: 'account_with_videos',
			icon: <VideoCameraOutlined />,
			iconBg: `${token.colorPrimary}18`,
			iconColor: token.colorPrimary,
			title: 'Account + Videos',
			subtitle: 'Comprehensive & Detailed',
			description: 'Crawl complete channel profile (followers, likes, bio...) along with up to N latest videos with engagement metrics.',
			tagText: 'Recommended',
			tagColor: 'blue',
		},
		{
			mode: 'account_only',
			icon: <UserOutlined />,
			iconBg: '#13c2c218',
			iconColor: '#13c2c2',
			title: 'Account Only',
			subtitle: 'Fast & Lean',
			description: 'Crawl channel profile only (followers, following, likes, bio, avatar). Skip videos for maximum crawling speed.',
			tagText: 'High Speed',
			tagColor: 'cyan',
		},
		{
			mode: 'video_only',
			icon: <LinkOutlined />,
			iconBg: '#fa8c1618',
			iconColor: '#fa8c16',
			title: 'Video URLs Only',
			subtitle: 'Independent Targets',
			description: 'Crawl specific TikTok videos directly from URL links without fetching creator channel metadata.',
			tagText: 'Direct Videos',
			tagColor: 'orange',
		},
	], [token.colorPrimary]);

	return (
		<>
			<Card
				size="small"
				title={
					<Space size={8}>
						<CompassOutlined style={{ color: token.colorPrimary }} />
						<Text strong style={{ fontSize: 15 }}>
							1. Select Crawl Scope
						</Text>
					</Space>
				}
				style={{ borderColor: token.colorBorderSecondary }}
			>
				<Form.Item name="crawl_mode" hidden>
					<Input />
				</Form.Item>

				<Row gutter={[16, 16]}>
					{modeConfigs.map((cfg) => (
						<CrawlModeOptionCard
							key={cfg.mode}
							{...cfg}
							selected={crawlMode === cfg.mode}
							isReadOnly={isReadOnly}
							onSelect={onSelectMode}
						/>
					))}
				</Row>
			</Card>

			{crawlMode === 'account_with_videos' && (
				<VideoLimitSlider
					maxVideos={maxVideos}
					isReadOnly={isReadOnly}
					onSelectPreset={onSelectMaxVideosPreset}
				/>
			)}
		</>
	);
}
