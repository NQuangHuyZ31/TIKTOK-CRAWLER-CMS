import React, { useMemo } from 'react';
import { Card, Radio, DatePicker, Space, Typography, Tag, theme } from 'antd';
import { CalendarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface VideoDateFilterSelectorProps {
	isReadOnly: boolean;
	value?: string | null;
	onChange?: (val: string | null) => void;
}

export default function VideoDateFilterSelector({
	isReadOnly,
	value = 'all',
	onChange,
}: VideoDateFilterSelectorProps) {
	const { token } = theme.useToken();

	const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
	const past7Str = useMemo(() => `range:${dayjs().subtract(7, 'day').format('YYYY-MM-DD')}:${dayjs().format('YYYY-MM-DD')}`, []);
	const past30Str = useMemo(() => `range:${dayjs().subtract(30, 'day').format('YYYY-MM-DD')}:${dayjs().format('YYYY-MM-DD')}`, []);
	const past90Str = useMemo(() => `range:${dayjs().subtract(90, 'day').format('YYYY-MM-DD')}:${dayjs().format('YYYY-MM-DD')}`, []);

	const filterMode = useMemo(() => {
		if (!value || value === 'all') return 'all';
		if (value === 'today' || value === 'yesterday') return value;
		if (value === past7Str || value === '7_days') return '7_days';
		if (value === past30Str || value === '30_days') return '30_days';
		if (value === past90Str || value === '90_days') return '90_days';
		if (typeof value === 'string' && value.startsWith('range:')) return 'range';
		return 'custom';
	}, [value, past7Str, past30Str, past90Str]);

	const customSingleDate = useMemo(() => {
		if (value && value !== 'all' && value !== 'today' && value !== 'yesterday' && !value.startsWith('range:')) {
			const d = dayjs(value);
			return d.isValid() ? d : null;
		}
		return null;
	}, [value]);

	const customRangeDates = useMemo<[Dayjs, Dayjs] | null>(() => {
		if (typeof value === 'string' && value.startsWith('range:')) {
			const parts = value.split(':');
			const dFrom = dayjs(parts[1]);
			const dTo = dayjs(parts[2]);
			if (dFrom.isValid() && dTo.isValid()) {
				return [dFrom, dTo];
			}
		}
		return null;
	}, [value]);

	const handleModeChange = (mode: string) => {
		switch (mode) {
			case 'all':
				onChange?.('all');
				break;
			case 'today':
				onChange?.('today');
				break;
			case 'yesterday':
				onChange?.('yesterday');
				break;
			case '7_days':
				onChange?.(past7Str);
				break;
			case '30_days':
				onChange?.(past30Str);
				break;
			case '90_days':
				onChange?.(past90Str);
				break;
			case 'range': {
				const fallbackRange = `range:${dayjs().subtract(14, 'day').format('YYYY-MM-DD')}:${todayStr}`;
				onChange?.(fallbackRange);
				break;
			}
			case 'custom': {
				onChange?.(todayStr);
				break;
			}
			default:
				onChange?.('all');
		}
	};

	const handleSingleDateChange = (date: Dayjs | null) => {
		if (date && date.isValid()) {
			onChange?.(date.format('YYYY-MM-DD'));
		} else {
			onChange?.('all');
		}
	};

	const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
		if (dates && dates[0] && dates[1] && dates[0].isValid() && dates[1].isValid()) {
			const dFrom = dates[0].format('YYYY-MM-DD');
			const dTo = dates[1].format('YYYY-MM-DD');
			onChange?.(`range:${dFrom}:${dTo}`);
		} else {
			onChange?.('all');
		}
	};

	return (
		<Card
			size="small"
			title={
				<Space size={8}>
					<CalendarOutlined style={{ color: token.colorPrimary }} />
					<Text strong style={{ fontSize: 14 }}>
						Video Date Filter
					</Text>
					{filterMode === 'today' && (
						<Tag color="green" icon={<ThunderboltOutlined />}>
							Early Exit Optimized
						</Tag>
					)}
				</Space>
			}
			style={{ borderColor: token.colorBorderSecondary, marginTop: 12 }}
		>
			<Space direction="vertical" size={12} style={{ width: '100%' }}>
				<Radio.Group
					disabled={isReadOnly}
					value={filterMode}
					onChange={(e) => handleModeChange(e.target.value)}
				>
					<Space direction="vertical" size={10}>
						<Radio value="all">
							<Text strong>All Recent Videos</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Fetch up to maximum video limit regardless of publication date)
							</Text>
						</Radio>

						<Radio value="today">
							<Text strong>Today Only</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Only crawl videos published today; stops early when older videos are encountered)
							</Text>
						</Radio>

						<Radio value="yesterday">
							<Text strong>Yesterday Only</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Only crawl videos published yesterday)
							</Text>
						</Radio>

						<Radio value="7_days">
							<Text strong>Past 7 Days</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Crawl videos published within the last 7 days)
							</Text>
						</Radio>

						<Radio value="30_days">
							<Text strong>Past 30 Days</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Crawl videos published within the last 30 days)
							</Text>
						</Radio>

						<Radio value="90_days">
							<Text strong>Past 90 Days</Text>
							<Text type="secondary" style={{ marginLeft: 8, fontSize: 13 }}>
								(Crawl videos published within the last 90 days)
							</Text>
						</Radio>

						<Radio value="range">
							<Space size={8} wrap>
								<Text strong>Custom Date Range:</Text>
								{filterMode === 'range' && (
									<RangePicker
										disabled={isReadOnly}
										value={customRangeDates}
										onChange={handleRangeChange}
										format="YYYY-MM-DD"
										allowClear={false}
										size="small"
									/>
								)}
							</Space>
						</Radio>

						<Radio value="custom">
							<Space size={8}>
								<Text strong>Specific Date:</Text>
								{filterMode === 'custom' && (
									<DatePicker
										disabled={isReadOnly}
										value={customSingleDate}
										onChange={handleSingleDateChange}
										format="YYYY-MM-DD"
										allowClear={false}
										placeholder="Select date"
										size="small"
									/>
								)}
							</Space>
						</Radio>
					</Space>
				</Radio.Group>
			</Space>
		</Card>
	);
}
