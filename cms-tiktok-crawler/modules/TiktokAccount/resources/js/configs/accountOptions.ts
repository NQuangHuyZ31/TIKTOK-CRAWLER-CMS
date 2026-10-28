import type { SelectOption } from '@core/configs/systemOptions';

// -----------------------------------------------------------------------------
// TIKTOK ACCOUNT STATUS & FILTER OPTIONS
// -----------------------------------------------------------------------------
export const TIKTOK_ACCOUNT_STATUS_FILTER_OPTIONS: SelectOption[] = [
	{ label: 'All statuses', value: '' },
	{ label: 'Active', value: 'active' },
	{ label: 'Inactive', value: 'inactive' },
	{ label: 'Banned', value: 'banned' },
];

export const TIKTOK_ACCOUNT_STATUS_CHANGE_OPTIONS: SelectOption[] = [
	{ value: 'active', label: 'Set as Active' },
	{ value: 'inactive', label: 'Set as Inactive' },
	{ value: 'banned', label: 'Ban Account', danger: true },
];
