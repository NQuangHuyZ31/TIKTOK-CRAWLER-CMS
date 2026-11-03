import React from 'react';
import TiktokAccountSelect from '../TiktokAccountSelect';
import TextListSourceInput from './TextListSourceInput';
import CountSourceInput from './CountSourceInput';

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
			<TextListSourceInput
				name="usernames"
				label="TikTok Usernames List:"
				countLabel="usernames"
				count={parsedUsernamesCount}
				rawText={usernamesRaw}
				placeholder={`khaby.lame\nmrbeast\nzachking\n(One username per line, automatically strips @ and TikTok URLs)`}
				sampleButtonText="Paste Sample"
				helpText="Enter one username per line or comma-separated. The system automatically removes @ characters and removes duplicate entries."
				requiredMessage="Please enter at least one TikTok username"
				isReadOnly={isReadOnly}
				onInsertSample={onInsertSample}
				onClearInput={onClearInput}
			/>
		);
	}

	if (sourceType === 'urls') {
		const isVideoOnly = crawlMode === 'video_only';
		return (
			<TextListSourceInput
				name="urls"
				label={isVideoOnly ? 'TikTok Video URLs List:' : 'TikTok Channel URLs List:'}
				countLabel="URLs"
				count={parsedUrlsCount}
				rawText={urlsRaw}
				placeholder={
					isVideoOnly
						? `https://www.tiktok.com/@khaby.lame/video/735000111222333444\nhttps://www.tiktok.com/@mrbeast/video/736000111222333444`
						: `https://www.tiktok.com/@khaby.lame\nhttps://www.tiktok.com/@mrbeast`
				}
				sampleButtonText="Paste Sample URLs"
				helpText={
					isVideoOnly
						? 'One valid TikTok video link per line (format: https://www.tiktok.com/@user/video/id).'
						: 'One valid TikTok profile link per line. The system automatically resolves usernames.'
				}
				requiredMessage="Please enter at least one TikTok URL"
				isReadOnly={isReadOnly}
				onInsertSample={onInsertSample}
				onClearInput={onClearInput}
			/>
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
			<CountSourceInput
				totalAccounts={totalAccounts}
				isReadOnly={isReadOnly}
				onSelectPreset={onSelectCountPreset}
			/>
		);
	}

	return null;
}
