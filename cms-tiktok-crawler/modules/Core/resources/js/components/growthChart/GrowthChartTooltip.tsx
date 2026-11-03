import React from 'react';
import { formatNumber } from '../../utils/formatNumber';

export interface GrowthChartTooltipProps {
	active?: boolean;
	payload?: ReadonlyArray<{ payload?: any; [key: string]: any }>;
	title: string;
}

export default function GrowthChartTooltip({ active, payload, title }: GrowthChartTooltipProps) {
	if (!active || !payload?.length) return null;
	const point = payload[0].payload;
	if (!point) return null;

	return (
		<div
			style={{
				backgroundColor: '#1f1f1f',
				color: '#ffffff',
				padding: '6px 12px',
				borderRadius: 8,
				boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
				fontSize: 12,
			}}
		>
			<div style={{ color: '#bfbfbf', fontSize: 11, marginBottom: 2 }}>{point.date}</div>
			<div style={{ fontWeight: 600, fontSize: 13 }}>
				{formatNumber(point.value)} {title.split(' ')[0]}
			</div>
			<div style={{ fontSize: 11, color: point.change >= 0 ? '#52c41a' : '#ff4d4f' }}>
				{point.change >= 0 ? `+${formatNumber(point.change)}` : formatNumber(point.change)} daily
			</div>
		</div>
	);
}
