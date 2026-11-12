import React, { useId } from 'react';
import { Card, Flex, Segmented, Skeleton, Space, Tag, Typography, theme } from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompactNumber, formatNumber, formatPercent } from '../utils/formatNumber';
import type { GrowthTrendData } from '../pages/ui/types';
import GrowthChartTooltip from './growthChart/GrowthChartTooltip';

const { Text, Title } = Typography;

export interface GrowthChartProps {
	title: string;
	subtitle?: string;
	data?: GrowthTrendData | null;
	loading?: boolean;
	color?: string;
	icon?: React.ReactNode;
	height?: number;
	selectedPeriod?: number;
	onPeriodChange?: (days: number) => void;
	periodOptions?: Array<{ label: string; value: number }>;
}

export default function GrowthChart({
	title,
	subtitle,
	data,
	loading = false,
	color = '#EC008C',
	icon,
	height = 240,
	selectedPeriod = 30,
	onPeriodChange,
	periodOptions = [
		{ label: '7D', value: 7 },
		{ label: '30D', value: 30 },
		{ label: '90D', value: 90 },
	],
}: GrowthChartProps) {
	const { token } = theme.useToken();
	const gradientId = useId().replace(/:/g, '_');
	const points = data?.points || [];
	const growthRate = data?.growth_rate ?? 0;
	const isPositiveGrowth = growthRate >= 0;
	const netChange = data?.net_change ?? 0;
	const currentValue = data?.current_value ?? 0;

	return (
		<Card
			style={{
				borderRadius: 14,
				border: `1px solid ${token.colorBorderSecondary}`,
				boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
				height: '100%',
			}}
			styles={{ body: { padding: '20px 24px 16px' } }}
		>
			<Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 12 }}>
				<Space align="center" size={10}>
					{icon && <span style={{ fontSize: 20, color }}>{icon}</span>}
					<div>
						<Space size={8} align="center">
							<Text strong style={{ fontSize: 16, color: token.colorText }}>
								{title}
							</Text>
							<Tag color={isPositiveGrowth ? 'success' : 'error'} icon={isPositiveGrowth ? <CaretUpOutlined /> : <CaretDownOutlined />} style={{ borderRadius: 12, fontWeight: 600, padding: '0 8px', margin: 0 }}>
								{isPositiveGrowth ? '+' : ''}
								{formatPercent(growthRate, 1)}
							</Tag>
						</Space>
						{subtitle && (
							<div>
								<Text type="secondary" style={{ fontSize: 12 }}>
									{subtitle}
								</Text>
							</div>
						)}
					</div>
				</Space>

				{onPeriodChange && <Segmented size="small" value={selectedPeriod} options={periodOptions} onChange={(val) => onPeriodChange(Number(val))} />}
			</Flex>

			<Flex justify="space-between" align="baseline" style={{ marginBottom: 14 }}>
				<div>
					<Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1f1f1f', letterSpacing: '-0.02em' }}>
						{loading ? <Skeleton.Button active size="small" style={{ width: 120, height: 28 }} /> : formatNumber(currentValue)}
					</Title>
					<Text type="secondary" style={{ fontSize: 13 }}>
						Net growth: <span style={{ fontWeight: 600, color: isPositiveGrowth ? '#52c41a' : '#ff4d4f' }}>{netChange >= 0 ? `+${formatNumber(netChange)}` : formatNumber(netChange)}</span> in the last {selectedPeriod}{' '}
						days
					</Text>
				</div>
			</Flex>

			<div style={{ width: '100%', height }}>
				{loading ? (
					<div style={{ padding: '24px 0' }}>
						<Skeleton active paragraph={{ rows: 5 }} />
					</div>
				) : points.length === 0 ? (
					<Flex justify="center" align="center" style={{ height }}>
						<Text type="secondary">No growth trend data available</Text>
					</Flex>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={points} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
							<defs>
								<linearGradient id={`gradient_${gradientId}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor={color} stopOpacity={0.25} />
									<stop offset="95%" stopColor={color} stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={token.colorBorderSecondary} />
							<XAxis dataKey="label" stroke="#8c8c8c" fontSize={11} tickLine={false} axisLine={false} />
							<YAxis stroke="#8c8c8c" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompactNumber} />
							<Tooltip content={(props) => <GrowthChartTooltip {...props} title={title} />} />
							<Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fillOpacity={1} fill={`url(#gradient_${gradientId})`} />
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</Card>
	);
}
