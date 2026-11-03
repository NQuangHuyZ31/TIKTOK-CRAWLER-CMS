import React from 'react';
import { Card, Flex, Space, Tag, Typography, theme } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { formatNumber } from '@core/utils/formatNumber';

const { Text } = Typography;

interface JobSummaryPreviewProps {
	crawlMode: string;
	sourceType: string;
	maxVideos: number;
	targetCount: number;
	estimatedVideos: number;
}

export default function JobSummaryPreview({
	crawlMode,
	sourceType,
	maxVideos,
	targetCount,
	estimatedVideos,
}: JobSummaryPreviewProps) {
	const { token } = theme.useToken();

	return (
		<Card
			size="small"
			style={{
				backgroundColor: `${token.colorPrimary}06`,
				borderColor: `${token.colorPrimary}30`,
			}}
			styles={{ body: { padding: '16px 20px' } }}
		>
			<Flex justify="space-between" align="center" wrap="wrap" gap={12}>
				<Space size={12}>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: '50%',
							backgroundColor: token.colorPrimary,
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 20,
						}}
					>
						<RocketOutlined />
					</div>
					<div>
						<Text strong style={{ fontSize: 14, display: 'block' }}>
							Job Overview
						</Text>
						<Space size={8} wrap style={{ marginTop: 2 }}>
							<Tag color="blue">
								{crawlMode === 'account_with_videos'
									? `Account + Videos (${maxVideos} videos/channel)`
									: crawlMode === 'account_only'
										? 'Account Only'
										: 'Video URLs Only'}
							</Tag>
							<Tag color="geekblue">
								Source:{' '}
								{sourceType === 'usernames'
									? 'Usernames List'
									: sourceType === 'urls'
										? 'URLs List'
										: sourceType === 'database'
											? 'Database Accounts'
											: 'Random Sampling'}
							</Tag>
							<Tag color={targetCount > 0 ? 'green' : 'default'}>
								Target: {formatNumber(targetCount)}{' '}
								{crawlMode === 'video_only' ? 'videos' : 'accounts'}
							</Tag>
							{crawlMode === 'account_with_videos' && targetCount > 0 && (
								<Tag color="purple">Estimated load: up to ~{formatNumber(estimatedVideos)} videos</Tag>
							)}
						</Space>
					</div>
				</Space>

				<Tag color="gold" style={{ fontSize: 12, padding: '4px 10px' }}>
					Initial status: Pending
				</Tag>
			</Flex>
		</Card>
	);
}
