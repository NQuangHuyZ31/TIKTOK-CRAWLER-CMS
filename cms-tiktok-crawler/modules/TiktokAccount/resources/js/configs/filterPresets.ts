import type { NumericPreset } from '@core/components/NumericRangeFilter';

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
