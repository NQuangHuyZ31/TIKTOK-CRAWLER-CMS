import React, { ReactNode } from 'react';
import { Card, Col, Flex, Space, Tag, Typography, theme } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export interface CrawlModeOptionCardProps {
	mode: 'account_with_videos' | 'account_only' | 'video_only';
	selected: boolean;
	isReadOnly: boolean;
	icon: ReactNode;
	iconBg: string;
	iconColor: string;
	title: string;
	subtitle: string;
	description: string;
	tagText: string;
	tagColor: string;
	onSelect: (mode: 'account_with_videos' | 'account_only' | 'video_only') => void;
}

export default function CrawlModeOptionCard({
	mode,
	selected,
	isReadOnly,
	icon,
	iconBg,
	iconColor,
	title,
	subtitle,
	description,
	tagText,
	tagColor,
	onSelect,
}: CrawlModeOptionCardProps) {
	const { token } = theme.useToken();

	return (
		<Col xs={24} md={8}>
			<Card
				hoverable={!isReadOnly}
				onClick={() => onSelect(mode)}
				style={{
					height: '100%',
					cursor: isReadOnly ? 'not-allowed' : 'pointer',
					borderColor: selected ? token.colorPrimary : token.colorBorderSecondary,
					backgroundColor: selected ? `${token.colorPrimary}0a` : undefined,
					borderWidth: selected ? 2 : 1,
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
								backgroundColor: iconBg,
								color: iconColor,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 18,
							}}
						>
							{icon}
						</div>
						<div>
							<Text strong style={{ fontSize: 14, display: 'block' }}>{title}</Text>
							<Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
						</div>
					</Space>
					{selected && <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 18 }} />}
				</Flex>
				<Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8, minHeight: 36 }}>
					{description}
				</Paragraph>
				<Tag color={tagColor} style={{ fontSize: 11, margin: 0 }}>{tagText}</Tag>
			</Card>
		</Col>
	);
}
