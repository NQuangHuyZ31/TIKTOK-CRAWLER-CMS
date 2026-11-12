import React from 'react';
import { Popover, theme } from 'antd';
import { FilterOutlined, CloseCircleFilled, DownOutlined } from '@ant-design/icons';
import NumericRangePopoverContent from './numericRangeFilter/NumericRangePopoverContent';
import { useNumericRangeFilter } from './numericRangeFilter/useNumericRangeFilter';

export interface NumericPreset {
	label: string;
	value: string;
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

export default function NumericRangeFilter({
	value,
	onChange,
	placeholder = 'Filter range',
	presets = [],
	allowClear = true,
	width = 160,
	style,
	minPlaceholder = 'Min',
	maxPlaceholder = 'Max',
}: NumericRangeFilterProps) {
	const { token } = theme.useToken();
	const {
		open,
		setOpen,
		customMin,
		setCustomMin,
		customMax,
		setCustomMax,
		displayLabel,
		handleApplyCustom,
		handleClear,
	} = useNumericRangeFilter(value, presets, onChange);

	const hasValue = Boolean(value);

	return (
		<Popover
			content={
				<NumericRangePopoverContent
					presets={presets}
					value={value}
					customMin={customMin}
					customMax={customMax}
					minPlaceholder={minPlaceholder}
					maxPlaceholder={maxPlaceholder}
					onPresetClick={(pVal) => {
						onChange?.(value === pVal ? undefined : pVal);
						setOpen(false);
					}}
					onCustomMinChange={setCustomMin}
					onCustomMaxChange={setCustomMax}
					onApplyCustom={handleApplyCustom}
					onClear={handleClear}
					onCancel={() => setOpen(false)}
				/>
			}
			trigger="click"
			open={open}
			onOpenChange={setOpen}
			placement="bottomLeft"
		>
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					minWidth: width,
					height: 32,
					padding: '4px 11px',
					background: token.colorBgContainer,
					border: hasValue ? `1px solid ${token.colorPrimary}` : `1px solid ${token.colorBorder}`,
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
					<FilterOutlined style={{ fontSize: 12, color: hasValue ? token.colorPrimary : token.colorTextSecondary }} />
					<span
						style={{
							color: hasValue ? token.colorPrimary : token.colorTextSecondary,
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
