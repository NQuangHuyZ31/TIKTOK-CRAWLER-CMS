import React from 'react';
import { Button, Flex, Form, InputNumber, Space, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { COUNT_PRESETS } from '../../configs/crawlerOptions';

const { Text } = Typography;

export interface CountSourceInputProps {
	totalAccounts?: number;
	isReadOnly: boolean;
	onSelectPreset: (count: number) => void;
}

export default function CountSourceInput({
	totalAccounts,
	isReadOnly,
	onSelectPreset,
}: CountSourceInputProps) {
	return (
		<div>
			<Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
				<Text strong>Number of accounts to sample:</Text>
				{!isReadOnly && (
					<Space size={4}>
						{COUNT_PRESETS.map((preset) => (
							<Button
								key={preset}
								size="small"
								type={totalAccounts === preset ? 'primary' : 'dashed'}
								onClick={() => onSelectPreset(preset)}
							>
								{preset}
							</Button>
						))}
					</Space>
				)}
			</Flex>

			<Form.Item
				name="total_accounts"
				rules={[{ required: true, message: 'Please enter sample count' }]}
				style={{ marginBottom: 8 }}
			>
				<InputNumber
					min={1}
					max={10000}
					precision={0}
					style={{ width: '100%' }}
					placeholder="Enter number of accounts to sample from database"
					disabled={isReadOnly}
				/>
			</Form.Item>

			<Text type="secondary" style={{ fontSize: 12 }}>
				<InfoCircleOutlined style={{ marginRight: 4 }} />
				The system will automatically select N accounts with the oldest crawl timestamps in the database for re-crawling.
			</Text>
		</div>
	);
}
