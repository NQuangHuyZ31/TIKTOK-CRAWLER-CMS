import React from 'react';
import { Button, Flex, Form, Input, Space, Tag, Typography } from 'antd';
import { BulbOutlined, ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatNumber } from '@core/utils/formatNumber';

const { Text } = Typography;

export interface TextListSourceInputProps {
	name: 'usernames' | 'urls';
	label: string;
	countLabel: string;
	count: number;
	rawText: string;
	placeholder: string;
	sampleButtonText: string;
	helpText: string;
	requiredMessage: string;
	isReadOnly: boolean;
	onInsertSample: () => void;
	onClearInput: () => void;
}

export default function TextListSourceInput({
	name,
	label,
	countLabel,
	count,
	rawText,
	placeholder,
	sampleButtonText,
	helpText,
	requiredMessage,
	isReadOnly,
	onInsertSample,
	onClearInput,
}: TextListSourceInputProps) {
	return (
		<div>
			<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
				<Space size={8}>
					<Text strong>{label}</Text>
					<Tag color={count > 0 ? 'processing' : 'default'}>
						Detected: {formatNumber(count)} {countLabel}
					</Tag>
				</Space>

				{!isReadOnly && (
					<Space size={6}>
						<Button size="small" type="dashed" icon={<BulbOutlined />} onClick={onInsertSample}>
							{sampleButtonText}
						</Button>
						{rawText && (
							<Button size="small" type="text" danger icon={<ClearOutlined />} onClick={onClearInput}>
								Clear
							</Button>
						)}
					</Space>
				)}
			</Flex>

			<Form.Item
				preserve={false}
				name={name}
				rules={[{ required: true, message: requiredMessage }]}
				style={{ marginBottom: 8 }}
			>
				<Input.TextArea
					rows={6}
					disabled={isReadOnly}
					placeholder={placeholder}
					style={{ fontFamily: 'monospace', fontSize: 13 }}
				/>
			</Form.Item>

			<Text type="secondary" style={{ fontSize: 12 }}>
				<InfoCircleOutlined style={{ marginRight: 4 }} />
				{helpText}
			</Text>
		</div>
	);
}
