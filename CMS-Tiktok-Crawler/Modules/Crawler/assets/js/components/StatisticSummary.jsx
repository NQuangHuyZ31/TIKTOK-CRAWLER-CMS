import { Card, Flex, Statistic, Typography } from 'antd';

const { Text } = Typography;

export default function StatisticSummary({ title, value, icon, color = '#1677ff' }) {
	return (
		<Card
			styles={{ body: { padding: 20 } }}
			style={{
				height: '100%',
				border: '1px solid #edf0f5',
				boxShadow: '0 4px 16px rgba(23, 32, 51, 0.04)',
			}}
		>
			<Flex align="flex-start" gap={16} justify="space-between">
				<div>
					<Text type="secondary" style={{ fontSize: 14, fontWeight: 500, textWrap: 'nowrap' }}>{title}</Text>
					<Statistic
						value={value}
						styles={{
							content: {
								fontSize: 25,
								fontWeight: 500,
								color: color
							}
						}}
					/>
				</div>
				<div
					style={{
						width: 60,
						height: 60,
						display: 'grid',
						placeItems: 'center',
						flexShrink: 0,
						borderRadius: 12,
						background: `${color}16`,
						color,
						fontSize: 25,
					}}
				>
					{icon}
				</div>
			</Flex>
		</Card>
	);
}
