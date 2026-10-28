import type { SelectOption } from '@core/configs/systemOptions';

// -----------------------------------------------------------------------------
// CRAWLER JOB CONFIGURATION & FILTER OPTIONS
// -----------------------------------------------------------------------------
export const CRAWL_JOB_STATUS_FILTER_OPTIONS: SelectOption[] = [
	{ label: 'All statuses', value: '' },
	{ label: 'Pending', value: 'pending' },
	{ label: 'Running', value: 'running' },
	{ label: 'Completed', value: 'completed' },
	{ label: 'Failed', value: 'failed' },
];
