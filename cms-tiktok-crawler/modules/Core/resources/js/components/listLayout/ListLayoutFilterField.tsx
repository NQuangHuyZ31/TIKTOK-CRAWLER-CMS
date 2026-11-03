import React, { ReactNode } from 'react';
import { DatePicker, Form, InputNumber, Radio, Select } from 'antd';
import NumericRangeFilter from '../NumericRangeFilter';
import type { DynamicFilterField } from './listLayoutTypes';

export interface ListLayoutFilterFieldProps {
	filter: DynamicFilterField;
	form: any;
}

export default function ListLayoutFilterField({ filter, form }: ListLayoutFilterFieldProps) {
	let inputComponent: ReactNode = null;

	if (filter.type === 'custom' && filter.render) {
		inputComponent = filter.render(form);
	} else if (filter.type === 'dateRange') {
		inputComponent = <DatePicker.RangePicker allowClear={filter.allowClear ?? true} style={{ minWidth: 240, ...filter.style }} />;
	} else if (filter.type === 'date') {
		inputComponent = <DatePicker placeholder={filter.placeholder} allowClear={filter.allowClear ?? true} style={{ minWidth: 150, ...filter.style }} />;
	} else if (filter.type === 'number') {
		inputComponent = <InputNumber placeholder={filter.placeholder} style={{ minWidth: filter.width ?? 130, ...filter.style }} />;
	} else if (filter.type === 'numberRange') {
		inputComponent = (
			<NumericRangeFilter
				placeholder={filter.placeholder ?? filter.label ?? 'Range'}
				presets={filter.presets}
				width={filter.width ?? 150}
				allowClear={filter.allowClear ?? true}
				style={filter.style}
			/>
		);
	} else if (filter.type === 'radio') {
		inputComponent = <Radio.Group optionType="button" buttonStyle="solid" options={filter.options} />;
	} else {
		inputComponent = (
			<Select
				placeholder={filter.placeholder ?? filter.label ?? 'Filter'}
				options={filter.options}
				allowClear={filter.allowClear ?? true}
				showSearch={filter.showSearch}
				style={{ minWidth: filter.width ?? 160, ...filter.style }}
			/>
		);
	}

	return (
		<Form.Item key={filter.key} name={filter.key} label={filter.label} initialValue={filter.initialValue} style={{ margin: 0 }}>
			{inputComponent}
		</Form.Item>
	);
}
