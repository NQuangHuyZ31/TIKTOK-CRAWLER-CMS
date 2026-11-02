import React from 'react';
import { Card, Col, Flex, Form, Input, Row, Space, Tag, Typography, theme } from 'antd';
import { CheckCircleFilled, CompassOutlined, LinkOutlined, UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import VideoLimitSlider from './VideoLimitSlider';

const { Text, Paragraph } = Typography;

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
					{/* Mode: Account + Videos */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => onSelectMode('account_with_videos')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor: crawlMode === 'account_with_videos' ? token.colorPrimary : token.colorBorderSecondary,
								backgroundColor: crawlMode === 'account_with_videos' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'account_with_videos' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: `${token.colorPrimary}18`,
											color: token.colorPrimary,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<VideoCameraOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>Account + Videos</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>Comprehensive & Detailed</Text>
									</div>
								</Space>
								{crawlMode === 'account_with_videos' && <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />}
							</Flex>
							<Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}>
								Crawl complete channel profile (followers, likes, bio...) along with up to N latest videos with engagement metrics.
							</Paragraph>
							<Tag color="blue" style={{ fontSize: 11, margin: 0 }}>Recommended</Tag>
						</Card>
					</Col>

					{/* Mode: Account Only */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => onSelectMode('account_only')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor: crawlMode === 'account_only' ? token.colorPrimary : token.colorBorderSecondary,
								backgroundColor: crawlMode === 'account_only' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'account_only' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: '#13c2c218',
											color: '#13c2c2',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<UserOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>Account Only</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>Fast & Lean</Text>
									</div>
								</Space>
								{crawlMode === 'account_only' && <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />}
							</Flex>
							<Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}>
								Crawl channel profile only (followers, following, likes, bio, avatar). Skip videos for maximum crawling speed.
							</Paragraph>
							<Tag color="cyan" style={{ fontSize: 11, margin: 0 }}>High Speed</Tag>
						</Card>
					</Col>

					{/* Mode: Video URLs Only */}
					<Col xs={24} md={8}>
						<Card
							hoverable={!isReadOnly}
							onClick={() => onSelectMode('video_only')}
							style={{
								height: '100%',
								cursor: isReadOnly ? 'not-allowed' : 'pointer',
								borderColor: crawlMode === 'video_only' ? token.colorPrimary : token.colorBorderSecondary,
								backgroundColor: crawlMode === 'video_only' ? `${token.colorPrimary}0a` : undefined,
								borderWidth: crawlMode === 'video_only' ? 2 : 1,
								transition: 'all 0.2s',
								position: 'relative',
							}}
							styles={{ body: { padding: '16px' } }}
						>
							<Flex justify="space-between" align="flex-start" style={{ marginBottom: 8 }}>
								<Space size={10}>
									<div
										style={{
											width: 36,
											height: 36,
											borderRadius: 8,
											backgroundColor: '#fa8c1618',
											color: '#fa8c16',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: 18,
										}}
									>
										<LinkOutlined />
									</div>
									<div>
										<Text strong style={{ fontSize: 14, display: 'block' }}>Video URLs Only</Text>
										<Text type="secondary" style={{ fontSize: 12 }}>Independent Targets</Text>
									</div>
								</Space>
								{crawlMode === 'video_only' && <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />}
							</Flex>
							<Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}>
								Crawl specific TikTok videos directly from URL links without fetching creator channel metadata.
							</Paragraph>
							<Tag color="orange" style={{ fontSize: 11, margin: 0 }}>Direct Videos</Tag>
						</Card>
					</Col>
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
