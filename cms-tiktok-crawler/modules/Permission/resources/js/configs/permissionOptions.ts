import type { SelectOption } from '@core/configs/systemOptions';

// -----------------------------------------------------------------------------
// PERMISSION & CRUD ACTION OPTIONS
// -----------------------------------------------------------------------------
export const BASIC_PERMISSION_ACTIONS: SelectOption[] = [
	{ label: 'View (view)', value: 'view', desc: 'Read-only access and data listing' },
	{ label: 'Create (create)', value: 'create', desc: 'Add new records and entities' },
	{ label: 'Edit (edit)', value: 'edit', desc: 'Modify existing records' },
	{ label: 'Delete (delete)', value: 'delete', desc: 'Permanently remove records' },
];

export const COMMON_PERMISSION_ACTIONS: SelectOption[] = [
	{ value: 'view', label: 'View (view)', desc: 'Read-only access and data listing' },
	{ value: 'create', label: 'Create (create)', desc: 'Add new records and entities' },
	{ value: 'edit', label: 'Edit (edit)', desc: 'Modify existing records' },
	{ value: 'delete', label: 'Delete (delete)', desc: 'Permanently remove records' },
	{ value: 'export', label: 'Export (export)', desc: 'Export data to CSV/Excel' },
	{ value: 'import', label: 'Import (import)', desc: 'Batch import data' },
	{ value: 'approve', label: 'Approve (approve)', desc: 'Approve workflows' },
	{ value: 'assign', label: 'Assign (assign)', desc: 'Assign roles or ownership' },
	{ value: 'manage', label: 'Manage (manage)', desc: 'Administrative actions' },
];
