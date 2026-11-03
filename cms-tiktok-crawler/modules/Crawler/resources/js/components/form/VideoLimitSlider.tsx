import React from 'react';
import { Button, Card, Col, Divider, Flex, Form, InputNumber, Row, Slider, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { SlidersOutlined } from '@ant-design/icons';
import { VIDEO_LIMIT_PRESETS } from '../../configs/crawlerOptions';

const { Text, Paragraph } = Typography;

interface VideoLimitSliderProps {
	maxVideos: number;
	isReadOnly: boolean;
	onSelectPreset: (val: number) => void;
}

export default function VideoLimitSlider({
	maxVideos,
	isReadOnly,
	onSelectPreset,
}: VideoLimitSliderProps) {
	const { token } = theme.useToken();

	return (
		<Card
			size="small"
			title={
				<Space size={8}>
					<SlidersOutlined style={{ color: token.colorPrimary }} />
					<Text strong style={{ fontSize: 15 }}>
						3. Video Parameters
					</Text>
				</Space>
			}
			style={{ borderColor: token.colorBorderSecondary }}
		>
			<Flex justify="space-between" align="center" style={{ marginBottom: 12 }} wrap="wrap" gap={8}>
				<div>
					<Text strong>Latest videos limit per account:</Text>
					<Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
						Limit from 1 to 100 recent videos published by each creator.
					</Paragraph>
				</div>

				{!isReadOnly && (
					<Space size={6} wrap>
						{VIDEO_LIMIT_PRESETS.map((item) => (
							<Tooltip key={item.value} title={item.desc}>
								<Button
									size="small"
									type={maxVideos === item.value ? 'primary' : 'dashed'}
									onClick={() => onSelectPreset(item.value)}
								>
									{item.label}
								</Button>
							</Tooltip>
						))}
					</Space>
				)}
			</Flex>

			<Row gutter={24} align="middle">
				<Col xs={24} sm={16} md={18}>
					<Form.Item name="max_videos_per_account" noStyle>
						<Slider
							min={1}
							max={100}
							disabled={isReadOnly}
							marks={{
								1: '1',
								10: '10',
								20: '20 (Std)',
								50: '50',
								100: '100 (Max)',
							}}
						/>
					</Form.Item>
				</Col>
				<Col xs={24} sm={8} md={6}>
					<Form.Item
						name="max_videos_per_account"
						rules={[{ required: true, message: 'Please specify maximum videos per account' }]}
						noStyle
					>
						<InputNumber
							min={1}
							max={100}
							precision={0}
							addonAfter="videos/channel"
							style={{ width: '100%' }}
							disabled={isReadOnly}
						/>
					</Form.Item>
				</Col>
			</Row>

			<Divider style={{ margin: '16px 0 12px' }} />

			<Flex align="center" gap={8}>
				<Tag color="cyan">Estimated Duration</Tag>
				<Text type="secondary" style={{ fontSize: 12 }}>
					Crawling ~{maxVideos} videos per account typically takes about 20-40 seconds per channel.
				</Text>
			</Flex>
		</Card>
	);
}
