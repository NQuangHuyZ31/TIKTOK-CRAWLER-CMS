import type { SelectOption } from '@core/configs/systemOptions';
import type { NumericPreset } from '@core/components/NumericRangeFilter';

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

export const FOLLOWER_PRESETS: NumericPreset[] = [
	{ label: '< 1K', value: '<1000' },
	{ label: '1K - 10K', value: '1000..10000' },
	{ label: '10K - 50K', value: '10000..50000' },
	{ label: '50K - 100K', value: '50000..100000' },
	{ label: '100K - 500K', value: '100000..500000' },
	{ label: '500K - 1M', value: '500000..1000000' },
	{ label: '≥ 1M', value: '>=1000000' },
];

export const FOLLOWING_PRESETS: NumericPreset[] = [
	{ label: '< 100', value: '<100' },
	{ label: '100 - 500', value: '100..500' },
	{ label: '500 - 1K', value: '500..1000' },
	{ label: '1K - 5K', value: '1000..5000' },
	{ label: '5K - 10K', value: '5000..10000' },
	{ label: '≥ 10K', value: '>=10000' },
];

export const LIKE_PRESETS: NumericPreset[] = [
	{ label: '< 10K', value: '<10000' },
	{ label: '10K - 50K', value: '10000..50000' },
	{ label: '50K - 100K', value: '50000..100000' },
	{ label: '100K - 500K', value: '100000..500000' },
	{ label: '500K - 1M', value: '500000..1000000' },
	{ label: '1M - 5M', value: '1000000..5000000' },
	{ label: '≥ 5M', value: '>=5000000' },
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
