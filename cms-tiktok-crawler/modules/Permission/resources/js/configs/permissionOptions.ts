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
	{ value: 'view', label: 'view (Read-only data access)' },
	{ value: 'create', label: 'create (Add new entries)' },
	{ value: 'edit', label: 'edit (Modify existing data)' },
	{ value: 'delete', label: 'delete (Delete entries)' },
	{ value: 'export', label: 'export (Export data to CSV/Excel)' },
	{ value: 'import', label: 'import (Batch import data)' },
	{ value: 'approve', label: 'approve (Approve workflows)' },
	{ value: 'assign', label: 'assign (Assign roles or ownership)' },
	{ value: 'manage', label: 'manage (Administrative actions)' },
];
