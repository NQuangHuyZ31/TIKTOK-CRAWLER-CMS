import React, { ReactNode } from 'react';
import { Card, Flex, Statistic, Typography, theme } from 'antd';

const { Text } = Typography;

export interface CardKPIProps {
	title: string;
	value: number | string;
	icon?: ReactNode;
	color?: string;
	prefix?: ReactNode;
	suffix?: ReactNode;
	precision?: number;
	subtext?: ReactNode;
	loading?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

export default function CardKPI({ title, value, icon, color = '#EC008C', prefix, suffix, precision, subtext, loading = false, style, className }: CardKPIProps) {
	const { token } = theme.useToken();

	return (
		<Card
			styles={{ body: { padding: 20 } }}
			loading={loading}
			className={className}
			style={{
				height: '100%',
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
				...style,
			}}
		>
			<Flex align="flex-start" gap={16}>
				{icon && (
					<div
						style={{
							width: 48,
							height: 48,
							borderRadius: 12,
							background: `${color}15`,
							color: color,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 22,
							flexShrink: 0,
						}}
					>
						{icon}
					</div>
				)}
				<div style={{ flex: 1, minWidth: 0 }}>
					<Text
						type="secondary"
						style={{
							fontSize: 13,
							display: 'block',
							marginBottom: 4,
						}}
					>
						{title}
					</Text>
					<Statistic
						value={value}
						prefix={prefix}
						suffix={suffix}
						precision={precision}
						valueStyle={{
							fontSize: 24,
							fontWeight: 700,
							color: token.colorText,
						}}
					/>
					{subtext && <div style={{ marginTop: 4 }}>{subtext}</div>}
				</div>
			</Flex>
		</Card>
	);
}
