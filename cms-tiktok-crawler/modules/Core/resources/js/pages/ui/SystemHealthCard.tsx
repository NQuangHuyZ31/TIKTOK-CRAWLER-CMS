import React from 'react';
import { Badge, Card, Flex, Space, Tag, Typography, theme } from 'antd';

const { Text } = Typography;

export default function SystemHealthCard() {
	const { token } = theme.useToken();

	return (
		<Card
			style={{
				borderRadius: 14,
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
			}}
			styles={{ body: { padding: '16px 20px' } }}
		>
			<Space direction="vertical" size={10} style={{ width: '100%' }}>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 13 }}>
						CMS Architecture:
					</Text>
					<Tag color="cyan" style={{ margin: 0, borderRadius: 4 }}>
						Ureka Modular
					</Tag>
				</Flex>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 13 }}>
						Crawl Pipeline:
					</Text>
					<Tag color="blue" style={{ margin: 0, borderRadius: 4 }}>
						Async Queue
					</Tag>
				</Flex>
				<Flex justify="space-between" align="center">
					<Text type="secondary" style={{ fontSize: 13 }}>
						Engine Status:
					</Text>
					<Badge status="success" text={<span style={{ fontSize: 13, color: '#52c41a', fontWeight: 500 }}>Ready</span>} />
				</Flex>
			</Space>
		</Card>
	);
}
