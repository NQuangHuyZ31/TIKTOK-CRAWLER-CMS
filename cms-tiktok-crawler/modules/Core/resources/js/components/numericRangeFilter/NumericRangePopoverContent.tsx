import React from 'react';
import { Button, InputNumber, Space, Tag, Typography } from 'antd';
import type { NumericPreset } from '../NumericRangeFilter';

const { Text } = Typography;

export interface NumericRangePopoverContentProps {
	presets?: NumericPreset[];
	value?: string;
	customMin: number | null;
	customMax: number | null;
	minPlaceholder?: string;
	maxPlaceholder?: string;
	onPresetClick: (presetValue: string) => void;
	onCustomMinChange: (val: number | null) => void;
	onCustomMaxChange: (val: number | null) => void;
	onApplyCustom: () => void;
	onClear: () => void;
	onCancel: () => void;
}

export default function NumericRangePopoverContent({
	presets = [],
	value,
	customMin,
	customMax,
	minPlaceholder = 'Min',
	maxPlaceholder = 'Max',
	onPresetClick,
	onCustomMinChange,
	onCustomMaxChange,
	onApplyCustom,
	onClear,
	onCancel,
}: NumericRangePopoverContentProps) {
	return (
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
									onChange={() => onPresetClick(preset.value)}
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
					<InputNumber min={0} placeholder={minPlaceholder} value={customMin} onChange={onCustomMinChange} style={{ width: '50%' }} />
					<InputNumber min={0} placeholder={maxPlaceholder} value={customMax} onChange={onCustomMaxChange} style={{ width: '50%' }} />
				</Space.Compact>

				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Button size="small" type="text" onClick={onClear} disabled={!value && customMin === null && customMax === null}>
						Reset
					</Button>
					<Space size={8}>
						<Button size="small" onClick={onCancel}>
							Cancel
						</Button>
						<Button size="small" type="primary" onClick={onApplyCustom}>
							Apply
						</Button>
					</Space>
				</div>
			</div>
		</div>
	);
}
