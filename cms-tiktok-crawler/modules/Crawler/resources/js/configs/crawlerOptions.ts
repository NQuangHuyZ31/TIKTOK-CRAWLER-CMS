import type { SelectOption } from '@core/configs/systemOptions';

// -----------------------------------------------------------------------------
// CRAWLER JOB CONFIGURATION & FILTER OPTIONS
// -----------------------------------------------------------------------------
export const CRAWL_JOB_STATUS_FILTER_OPTIONS: SelectOption[] = [
	{ label: 'All statuses', value: '' },
	{ label: 'Pending', value: 'pending' },
	{ label: 'Queued', value: 'queued' },
	{ label: 'Running', value: 'running' },
	{ label: 'Completed', value: 'completed' },
	{ label: 'Failed', value: 'failed' },
];

export const CRAWL_RESULT_STATUS_FILTER_OPTIONS: SelectOption[] = [
	{ label: 'All statuses', value: '' },
	{ label: 'Success', value: 'success' },
	{ label: 'Failed', value: 'failed' },
];

// -----------------------------------------------------------------------------
// FORM PRESETS & SAMPLE TEMPLATES
// -----------------------------------------------------------------------------
export interface VideoLimitPreset {
	label: string;
	value: number;
	desc: string;
}

export const VIDEO_LIMIT_PRESETS: VideoLimitPreset[] = [
	{ label: '10 Videos', value: 10, desc: 'Fast - Testing' },
	{ label: '20 Videos', value: 20, desc: 'Standard (Default)' },
	{ label: '50 Videos', value: 50, desc: 'Deep Analysis' },
	{ label: '100 Videos', value: 100, desc: 'Maximum' },
];

export const COUNT_PRESETS = [10, 25, 50, 100, 200];

export const SAMPLE_USERNAMES = ['khaby.lame', 'mrbeast', 'zachking', 'bellapoarch'].join('\n');

export const SAMPLE_PROFILE_URLS = [
	'https://www.tiktok.com/@khaby.lame',
	'https://www.tiktok.com/@mrbeast',
	'https://www.tiktok.com/@zachking',
].join('\n');

export const SAMPLE_VIDEO_URLS = [
	'https://www.tiktok.com/@khaby.lame/video/735000111222333444',
	'https://www.tiktok.com/@mrbeast/video/736000111222333444',
].join('\n');
