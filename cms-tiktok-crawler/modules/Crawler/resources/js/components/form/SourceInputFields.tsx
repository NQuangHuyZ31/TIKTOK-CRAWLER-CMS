import React from 'react';
import { Button, Flex, Form, Input, InputNumber, Space, Tag, Typography } from 'antd';
import { BulbOutlined, ClearOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatNumber } from '@core/utils/formatNumber';
import { COUNT_PRESETS } from '../../configs/crawlerOptions';
import TiktokAccountSelect from '../TiktokAccountSelect';

const { Text } = Typography;

interface SourceInputFieldsProps {
	sourceType: string;
	crawlMode: string;
	isReadOnly: boolean;
	usernamesRaw: string;
	urlsRaw: string;
	totalAccounts?: number;
	parsedUsernamesCount: number;
	parsedUrlsCount: number;
	onInsertSample: () => void;
	onClearInput: () => void;
	onSelectCountPreset: (count: number) => void;
	onDatabaseSelectChange: (ids: any[]) => void;
}

export default function SourceInputFields({
	sourceType,
	crawlMode,
	isReadOnly,
	usernamesRaw,
	urlsRaw,
	totalAccounts,
	parsedUsernamesCount,
	parsedUrlsCount,
	onInsertSample,
	onClearInput,
	onSelectCountPreset,
	onDatabaseSelectChange,
}: SourceInputFieldsProps) {
	if (sourceType === 'usernames') {
		return (
			<div>
				<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
					<Space size={8}>
						<Text strong>TikTok Usernames List:</Text>
						<Tag color={parsedUsernamesCount > 0 ? 'processing' : 'default'}>
							Detected: {formatNumber(parsedUsernamesCount)} usernames
						</Tag>
					</Space>

					{!isReadOnly && (
						<Space size={6}>
							<Button size="small" type="dashed" icon={<BulbOutlined />} onClick={onInsertSample}>
								Paste Sample
							</Button>
							{usernamesRaw && (
								<Button size="small" type="text" danger icon={<ClearOutlined />} onClick={onClearInput}>
									Clear
								</Button>
							)}
						</Space>
					)}
				</Flex>

				<Form.Item
					preserve={false}
					name="usernames"
					rules={[{ required: true, message: 'Please enter at least one TikTok username' }]}
					style={{ marginBottom: 8 }}
				>
					<Input.TextArea
						rows={6}
						disabled={isReadOnly}
						placeholder={`khaby.lame\nmrbeast\nzachking\n(One username per line, automatically strips @ and TikTok URLs)`}
						style={{ fontFamily: 'monospace', fontSize: 13 }}
					/>
				</Form.Item>

				<Text type="secondary" style={{ fontSize: 12 }}>
					<InfoCircleOutlined style={{ marginRight: 4 }} />
					Enter one username per line or comma-separated. The system automatically removes <code>@</code> characters and removes duplicate entries.
				</Text>
			</div>
		);
	}

	if (sourceType === 'urls') {
		return (
			<div>
				<Flex justify="space-between" align="center" style={{ marginBottom: 8 }} wrap="wrap" gap={8}>
					<Space size={8}>
						<Text strong>
							{crawlMode === 'video_only'
								? 'TikTok Video URLs List:'
								: 'TikTok Channel URLs List:'}
						</Text>
						<Tag color={parsedUrlsCount > 0 ? 'processing' : 'default'}>
							Detected: {formatNumber(parsedUrlsCount)} URLs
						</Tag>
					</Space>

					{!isReadOnly && (
						<Space size={6}>
							<Button size="small" type="dashed" icon={<BulbOutlined />} onClick={onInsertSample}>
								Paste Sample URLs
							</Button>
							{urlsRaw && (
								<Button size="small" type="text" danger icon={<ClearOutlined />} onClick={onClearInput}>
									Clear
								</Button>
							)}
						</Space>
					)}
				</Flex>

				<Form.Item
					preserve={false}
					name="urls"
					rules={[{ required: true, message: 'Please enter at least one TikTok URL' }]}
					style={{ marginBottom: 8 }}
				>
					<Input.TextArea
						rows={6}
						disabled={isReadOnly}
						placeholder={
							crawlMode === 'video_only'
								? `https://www.tiktok.com/@khaby.lame/video/735000111222333444\nhttps://www.tiktok.com/@mrbeast/video/736000111222333444`
								: `https://www.tiktok.com/@khaby.lame\nhttps://www.tiktok.com/@mrbeast`
						}
						style={{ fontFamily: 'monospace', fontSize: 13 }}
					/>
				</Form.Item>

				<Text type="secondary" style={{ fontSize: 12 }}>
					<InfoCircleOutlined style={{ marginRight: 4 }} />
					{crawlMode === 'video_only'
						? 'One valid TikTok video link per line (format: https://www.tiktok.com/@user/video/id).'
						: 'One valid TikTok profile link per line. The system automatically resolves usernames.'}
				</Text>
			</div>
		);
	}

	if (sourceType === 'database') {
		return (
			<TiktokAccountSelect
				disabled={isReadOnly}
				onChange={onDatabaseSelectChange}
			/>
		);
	}

	if (sourceType === 'count') {
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
									onClick={() => onSelectCountPreset(preset)}
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

	return null;
}
