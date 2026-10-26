import React, { useState, useEffect, useMemo } from 'react';
import { Popover, Button, InputNumber, Space, Typography, Tag } from 'antd';
import { FilterOutlined, CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import { formatNumber } from '../utils/formatNumber';

const { Text } = Typography;

export interface NumericPreset {
	label: string;
	value: string; // e.g. '<1000', '1000..10000', '>=1000000'
}

export interface NumericRangeFilterProps {
	value?: string;
	onChange?: (value: string | undefined) => void;
	placeholder?: string;
	presets?: NumericPreset[];
	allowClear?: boolean;
	width?: number | string;
	style?: React.CSSProperties;
	minPlaceholder?: string;
	maxPlaceholder?: string;
}

/**
 * Reusable Numeric Range Filter component with quick presets and custom Min/Max inputs.
 * Emits standard range strings compatible with Core FilterSearchTrait:
 * - 'min..max'
 * - '>=min'
 * - '<=max'
 * - '<max'
 */
export default function NumericRangeFilter({ value, onChange, placeholder = 'Filter range', presets = [], allowClear = true, width = 160, style, minPlaceholder = 'Min', maxPlaceholder = 'Max' }: NumericRangeFilterProps) {
	const [open, setOpen] = useState(false);
	const [customMin, setCustomMin] = useState<number | null>(null);
	const [customMax, setCustomMax] = useState<number | null>(null);

	// Parse current value into customMin and customMax when opened or value changes
	useEffect(() => {
		if (!value) {
			setCustomMin(null);
			setCustomMax(null);
			return;
		}

		if (value.includes('..')) {
			const parts = value.split('..');
			setCustomMin(parts[0] ? Number(parts[0]) : null);
			setCustomMax(parts[1] ? Number(parts[1]) : null);
		} else if (value.startsWith('>=')) {
			setCustomMin(Number(value.replace('>=', '')));
			setCustomMax(null);
		} else if (value.startsWith('<=')) {
			setCustomMin(null);
			setCustomMax(Number(value.replace('<=', '')));
		} else if (value.startsWith('<')) {
			setCustomMin(null);
			setCustomMax(Number(value.replace('<', '')));
		} else if (value.startsWith('>')) {
			setCustomMin(Number(value.replace('>', '')));
			setCustomMax(null);
		}
	}, [value]);

	// Resolve active label to display on trigger
	const displayLabel = useMemo(() => {
		if (!value) return null;

		const matchingPreset = presets.find((p) => p.value === value);
		if (matchingPreset) {
			return matchingPreset.label;
		}

		if (value.includes('..')) {
			const [min, max] = value.split('..');
			return `${formatNumber(min)} - ${formatNumber(max)}`;
		}
		if (value.startsWith('>=')) {
			return `≥ ${formatNumber(value.replace('>=', ''))}`;
		}
		if (value.startsWith('<=')) {
			return `≤ ${formatNumber(value.replace('<=', ''))}`;
		}
		if (value.startsWith('<')) {
			return `< ${formatNumber(value.replace('<', ''))}`;
		}
		if (value.startsWith('>')) {
			return `> ${formatNumber(value.replace('>', ''))}`;
		}

		return value;
	}, [value, presets]);

	const handlePresetClick = (presetValue: string) => {
		if (value === presetValue) {
			onChange?.(undefined);
		} else {
			onChange?.(presetValue);
		}
		setOpen(false);
	};

	const handleApplyCustom = () => {
		let finalVal: string | undefined = undefined;

		if (customMin !== null && customMax !== null) {
			const min = Math.min(customMin, customMax);
			const max = Math.max(customMin, customMax);
			finalVal = `${min}..${max}`;
		} else if (customMin !== null) {
			finalVal = `>=${customMin}`;
		} else if (customMax !== null) {
			finalVal = `<=${customMax}`;
		}

		onChange?.(finalVal);
		setOpen(false);
	};

	const handleClear = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		setCustomMin(null);
		setCustomMax(null);
		onChange?.(undefined);
		setOpen(false);
	};

	const popoverContent = (
		<div style={{ width: 280, padding: '4px 2px' }}>
			{presets.length > 0 && (
				<div style={{ marginBottom: 14 }}>
					<Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
						Quick Presets
					</Text>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
						{presets.map((preset) => {
							const isActive = value === preset.value;
							return (
								<Tag.CheckableTag
									key={preset.value}
									checked={isActive}
									onChange={() => handlePresetClick(preset.value)}
									style={{
										padding: '2px 8px',
										fontSize: 12,
										borderRadius: 4,
										border: isActive ? '1px solid #1677ff' : '1px solid #d9d9d9',
										background: isActive ? '#e6f4ff' : '#fafafa',
									}}
								>
									{preset.label}
								</Tag.CheckableTag>
							);
						})}
					</div>
				</div>
			)}

			<div>
				<Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 500 }}>
					Custom Range
				</Text>
				<Space.Compact style={{ width: '100%', marginBottom: 12 }}>
					<InputNumber min={0} placeholder={minPlaceholder} value={customMin} onChange={(val) => setCustomMin(val)} style={{ width: '50%' }} />
					<InputNumber min={0} placeholder={maxPlaceholder} value={customMax} onChange={(val) => setCustomMax(val)} style={{ width: '50%' }} />
				</Space.Compact>

				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Button size="small" type="text" onClick={handleClear} disabled={!value && customMin === null && customMax === null}>
						Reset
					</Button>
					<Space size={8}>
						<Button size="small" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button size="small" type="primary" onClick={handleApplyCustom}>
							Apply
						</Button>
					</Space>
				</div>
			</div>
		</div>
	);

	const hasValue = Boolean(value);

	return (
		<Popover content={popoverContent} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					minWidth: width,
					height: 32,
					padding: '4px 11px',
					background: '#fff',
					border: hasValue ? '1px solid #1677ff' : '1px solid #d9d9d9',
					borderRadius: 6,
					cursor: 'pointer',
					userSelect: 'none',
					fontSize: 14,
					transition: 'all 0.2s',
					boxShadow: hasValue ? '0 0 0 2px rgba(22, 119, 255, 0.1)' : undefined,
					...style,
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
					<FilterOutlined style={{ fontSize: 12, color: hasValue ? '#1677ff' : '#8c8c8c' }} />
					<span
						style={{
							color: hasValue ? '#1677ff' : '#8c8c8c',
							fontWeight: hasValue ? 500 : 400,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{displayLabel ?? placeholder}
					</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
					{hasValue && allowClear ? <CloseCircleFilled onClick={handleClear} style={{ color: '#bfbfbf', fontSize: 12, cursor: 'pointer' }} /> : <DownOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />}
				</div>
			</div>
		</Popover>
	);
}
