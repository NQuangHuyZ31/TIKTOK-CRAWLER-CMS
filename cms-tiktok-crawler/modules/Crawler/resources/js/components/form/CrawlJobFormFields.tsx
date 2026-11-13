import React, { useMemo } from 'react';
import { Alert, Card, Form, Space, Typography, theme } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { type ResourceFormRenderContext } from '@core/components/ResourceForm';
import {
	SAMPLE_PROFILE_URLS,
	SAMPLE_USERNAMES,
	SAMPLE_VIDEO_URLS,
} from '../../configs/crawlerOptions';
import { extractCleanUrls, extractCleanUsernames } from '../../utils/crawlerHelpers';
import CrawlModeSelector from './CrawlModeSelector';
import VideoDateFilterSelector from './VideoDateFilterSelector';
import SourceTypeSelector from './SourceTypeSelector';
import SourceInputFields from './SourceInputFields';
import JobSummaryPreview from './JobSummaryPreview';

const { Text } = Typography;

export default function CrawlJobFormFields({ form, isEdit, record }: ResourceFormRenderContext) {
	const { token } = theme.useToken();
	const sourceType = Form.useWatch('source_type', form) || 'usernames';
	const crawlMode = Form.useWatch('crawl_mode', form) || 'account_with_videos';
	const maxVideos = Form.useWatch('max_videos_per_account', form) ?? 20;
	const usernamesRaw = Form.useWatch('usernames', form) || '';
	const urlsRaw = Form.useWatch('urls', form) || '';
	const accountIds = Form.useWatch('account_ids', form) || [];
	const totalAccounts = Form.useWatch('total_accounts', form) || 0;

	const isReadOnly = Boolean(isEdit && record && record.status !== 'pending');
	const parsedUsernames = useMemo(() => extractCleanUsernames(usernamesRaw), [usernamesRaw]);
	const parsedUrls = useMemo(() => extractCleanUrls(urlsRaw), [urlsRaw]);

	const handleCrawlModeSelect = (mode: 'account_with_videos' | 'account_only' | 'video_only') => {
		if (isReadOnly) return;
		form.setFieldsValue({
			crawl_mode: mode,
			max_videos_per_account: mode === 'account_only' ? 0 : (Number(form.getFieldValue('max_videos_per_account')) || 20),
			...(mode === 'video_only' ? { source_type: 'urls' } : {}),
		});
	};

	const handleSourceChange = (val: string) => {
		form.setFieldsValue({
			source_type: val,
			usernames: undefined,
			urls: undefined,
			account_ids: [],
			total_accounts: undefined,
		});
	};

	const handleInsertSample = () => {
		if (sourceType === 'usernames') {
			form.setFieldsValue({ usernames: SAMPLE_USERNAMES });
		} else if (sourceType === 'urls') {
			form.setFieldsValue({
				urls: crawlMode === 'video_only' ? SAMPLE_VIDEO_URLS : SAMPLE_PROFILE_URLS,
			});
		}
	};

	const targetCount = useMemo(() => {
		if (sourceType === 'usernames') return parsedUsernames.length;
		if (sourceType === 'urls') return parsedUrls.length;
		if (sourceType === 'database') return accountIds.length;
		if (sourceType === 'count') return Number(totalAccounts) || 0;
		return 0;
	}, [sourceType, parsedUsernames.length, parsedUrls.length, accountIds.length, totalAccounts]);

	const estimatedVideos = useMemo(() => {
		if (crawlMode === 'video_only') return targetCount;
		if (crawlMode === 'account_only') return 0;
		return targetCount * Number(maxVideos);
	}, [crawlMode, targetCount, maxVideos]);

	return (
		<Space direction="vertical" size={20} style={{ width: '100%' }}>
			{isReadOnly && (
				<Alert
					type="warning"
					message="This job is no longer pending and cannot be modified."
					showIcon
				/>
			)}

			<CrawlModeSelector
				crawlMode={crawlMode}
				maxVideos={maxVideos}
				isReadOnly={isReadOnly}
				onSelectMode={handleCrawlModeSelect}
				onSelectMaxVideosPreset={(val) => form.setFieldsValue({ max_videos_per_account: val })}
			/>

			{crawlMode === 'account_with_videos' && (
				<Form.Item name="target_date" noStyle>
					<VideoDateFilterSelector isReadOnly={isReadOnly} />
				</Form.Item>
			)}

			<Card
				size="small"
				title={
					<Space size={8}>
						<DatabaseOutlined style={{ color: token.colorPrimary }} />
						<Text strong style={{ fontSize: 15 }}>
							2. Target Source
						</Text>
					</Space>
				}
				style={{ borderColor: token.colorBorderSecondary }}
			>
				<SourceTypeSelector
					isReadOnly={isReadOnly}
					disabled={crawlMode === 'video_only'}
					onChange={handleSourceChange}
				/>
				<SourceInputFields
					sourceType={sourceType}
					crawlMode={crawlMode}
					isReadOnly={isReadOnly}
					usernamesRaw={usernamesRaw}
					urlsRaw={urlsRaw}
					totalAccounts={totalAccounts}
					parsedUsernamesCount={parsedUsernames.length}
					parsedUrlsCount={parsedUrls.length}
					onInsertSample={handleInsertSample}
					onClearInput={() => form.setFieldsValue({ [sourceType]: '' })}
					onSelectCountPreset={(count) => form.setFieldsValue({ total_accounts: count })}
					onDatabaseSelectChange={(ids) => form.setFieldsValue({ account_ids: ids })}
				/>
			</Card>

			<JobSummaryPreview
				crawlMode={crawlMode}
				sourceType={sourceType}
				maxVideos={maxVideos}
				targetCount={targetCount}
				estimatedVideos={estimatedVideos}
			/>
		</Space>
	);
}
