import React from 'react';
import { Form, Radio } from 'antd';
import { DatabaseOutlined, LinkOutlined, NumberOutlined, UserOutlined } from '@ant-design/icons';

interface SourceTypeSelectorProps {
	isReadOnly: boolean;
	disabled: boolean;
	onChange: (sourceType: string) => void;
}

export default function SourceTypeSelector({
	isReadOnly,
	disabled,
	onChange,
}: SourceTypeSelectorProps) {
	return (
		<Form.Item
			name="source_type"
			label="Target Source Method"
			style={{ marginBottom: 16 }}
		>
			<Radio.Group
				optionType="button"
				buttonStyle="solid"
				onChange={(e) => onChange(e.target.value)}
				disabled={isReadOnly || disabled}
			>
				<Radio.Button value="usernames">
					<UserOutlined /> TikTok Usernames
				</Radio.Button>
				<Radio.Button value="urls">
					<LinkOutlined /> Profile / Video URLs
				</Radio.Button>
				<Radio.Button value="database">
					<DatabaseOutlined /> Select from Database
				</Radio.Button>
				<Radio.Button value="count">
					<NumberOutlined /> Random Sample (Count)
				</Radio.Button>
			</Radio.Group>
		</Form.Item>
	);
}
