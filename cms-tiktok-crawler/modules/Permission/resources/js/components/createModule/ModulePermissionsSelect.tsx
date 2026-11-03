import React from 'react';
import { Button, Form, Select, Space, Typography } from 'antd';
import { BASIC_PERMISSION_ACTIONS, COMMON_PERMISSION_ACTIONS } from '../../configs/permissionOptions';

const { Text } = Typography;

export interface ModulePermissionsSelectProps {
	onSelectAll: () => void;
	onDeselectAll: () => void;
}

const SELECT_OPTIONS = [
	{
		label: 'Basic Permissions',
		options: BASIC_PERMISSION_ACTIONS.map((item) => ({
			value: item.value,
			label: item.label,
			desc: item.desc,
		})),
	},
	{
		label: 'Additional Common Actions',
		options: COMMON_PERMISSION_ACTIONS.filter(
			(c) => !BASIC_PERMISSION_ACTIONS.some((b) => b.value === c.value)
		).map((item) => ({
			value: item.value,
			label: item.label,
			desc: item.desc,
		})),
	},
];

export default function ModulePermissionsSelect({ onSelectAll, onDeselectAll }: ModulePermissionsSelectProps) {
	return (
		<Form.Item
			name="actions"
			label={
				<Space style={{ width: '100%', justifyContent: 'space-between' }}>
					<span>Basic Permissions</span>
					<Space size="small">
						<Button type="link" size="small" onClick={onSelectAll} style={{ padding: 0 }}>
							Select All
						</Button>
						<Text type="secondary">|</Text>
						<Button type="link" size="small" onClick={onDeselectAll} style={{ padding: 0 }}>
							Clear
						</Button>
					</Space>
				</Space>
			}
			rules={[{ required: true, message: 'Please select at least one permission action' }]}
		>
			<Select
				mode="multiple"
				allowClear
				style={{ width: '100%' }}
				placeholder="Select basic permissions (e.g. view, create, edit, delete)"
				maxTagCount="responsive"
				options={SELECT_OPTIONS}
				filterOption={(input, option) => {
					const search = input.toLowerCase();
					const labelStr = String(option?.label ?? '').toLowerCase();
					const valStr = option && 'value' in option ? String(option.value).toLowerCase() : '';
					const descStr = option && 'desc' in option ? String((option as any).desc).toLowerCase() : '';
					return labelStr.includes(search) || valStr.includes(search) || descStr.includes(search);
				}}
				optionRender={(option) => (
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<Text strong style={{ fontSize: 13 }}>
							{option.data.label}
						</Text>
						{(option.data as any)?.desc && (
							<Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
								{(option.data as any).desc}
							</Text>
						)}
					</div>
				)}
			/>
		</Form.Item>
	);
}
