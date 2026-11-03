import React, { useMemo } from 'react';
import { Table, Alert } from 'antd';
import type { PermissionItem, PermissionInputType, ModuleRow } from './permissionMatrix/permissionMatrixTypes';
import { normalizePermissions } from './permissionMatrix/permissionMatrixHelpers';
import PermissionMatrixToolbar from './permissionMatrix/PermissionMatrixToolbar';
import { buildMatrixColumns } from './permissionMatrix/buildMatrixColumns';

export type { PermissionItem, PermissionInputType };

export interface PermissionMatrixProps {
	permissions?: PermissionInputType;
	value?: (string | number)[];
	selectedIds?: number[];
	onChange?: (selected: any[]) => void;
	mode?: 'slug' | 'id' | 'auto';
	disabled?: boolean;
	isAdmin?: boolean;
	title?: string;
}

export default function PermissionMatrix({
	permissions,
	value,
	selectedIds,
	onChange,
	mode = 'auto',
	disabled = false,
	isAdmin = false,
	title = 'Module Permission Matrix',
}: PermissionMatrixProps) {
	const moduleRows = useMemo(() => normalizePermissions(permissions), [permissions]);
	const allItems = useMemo(() => moduleRows.flatMap((r) => r.items), [moduleRows]);

	const rawSelected = useMemo(() => {
		if (value !== undefined && Array.isArray(value)) return value;
		if (selectedIds !== undefined && Array.isArray(selectedIds)) return selectedIds;
		return [];
	}, [value, selectedIds]);

	const activeMode = useMemo<'slug' | 'id'>(() => {
		if (mode === 'slug') return 'slug';
		if (mode === 'id') return 'id';
		if (selectedIds !== undefined) return 'id';
		if (rawSelected.length > 0 && typeof rawSelected[0] === 'number') return 'id';
		return 'slug';
	}, [mode, selectedIds, rawSelected]);

	const selectedLookup = useMemo(() => {
		const set = new Set<string | number>();
		rawSelected.forEach((s) => {
			set.add(s);
			if (typeof s === 'number') set.add(String(s));
		});
		return set;
	}, [rawSelected]);

	const isSelected = (item: PermissionItem): boolean => {
		if (isAdmin) return true;
		return selectedLookup.has(item.id) || selectedLookup.has(item.slug) || selectedLookup.has(String(item.id));
	};

	const displayActions = useMemo(() => {
		const standardActions = ['view', 'create', 'edit', 'delete'];
		const allActionsSet = new Set<string>();
		moduleRows.forEach((row) => Object.keys(row.actions).forEach((act) => allActionsSet.add(act)));
		const ordered = standardActions.filter((a) => allActionsSet.has(a));
		allActionsSet.forEach((a) => {
			if (!ordered.includes(a)) ordered.push(a);
		});
		return ordered.length > 0 ? ordered : standardActions;
	}, [moduleRows]);

	const allIdentifiers = useMemo(() => allItems.map((p) => (activeMode === 'slug' ? p.slug : p.id)), [allItems, activeMode]);
	const selectedCount = useMemo(() => (isAdmin ? allItems.length : allItems.filter((p) => isSelected(p)).length), [allItems, isAdmin, selectedLookup]);
	const isAllSelected = useMemo(() => (isAdmin ? true : allItems.length > 0 && allItems.every((p) => isSelected(p))), [allItems, isAdmin, selectedLookup]);
	const isIndeterminate = useMemo(() => (!isAdmin && selectedCount > 0 && selectedCount < allItems.length), [selectedCount, allItems.length, isAdmin]);

	const handleSelectAll = (checked: boolean) => {
		if (disabled || isAdmin) return;
		onChange?.(checked ? allIdentifiers : []);
	};

	const handleTogglePermission = (item: PermissionItem, checked: boolean) => {
		if (disabled || isAdmin) return;
		const targetId = activeMode === 'slug' ? item.slug : item.id;
		const next = checked
			? [...rawSelected, targetId]
			: rawSelected.filter((val) => val !== item.slug && val !== item.id && String(val) !== String(item.id));
		onChange?.(next);
	};

	const handleToggleModule = (row: ModuleRow, checked: boolean) => {
		if (disabled || isAdmin) return;
		const rowIdentifiers = row.items.map((p) => (activeMode === 'slug' ? p.slug : p.id));
		const rowIdSet = new Set(row.items.map((p) => p.id));
		const rowSlugSet = new Set(row.items.map((p) => p.slug));

		let next: any[];
		if (checked) {
			const missing = rowIdentifiers.filter((id) => !rawSelected.includes(id as any));
			next = [...rawSelected, ...missing];
		} else {
			next = rawSelected.filter((val) => !rowIdSet.has(Number(val)) && !rowSlugSet.has(String(val)));
		}
		onChange?.(next);
	};

	const columns = useMemo(
		() => buildMatrixColumns({ displayActions, disabled, isAdmin, isSelected, onTogglePermission: handleTogglePermission, onToggleModule: handleToggleModule }),
		[displayActions, disabled, isAdmin, selectedLookup]
	);

	return (
		<div style={{ marginTop: 8, width: '100%' }}>
			{isAdmin && (
				<Alert
					type="info"
					showIcon
					style={{ marginBottom: 12, borderRadius: 8 }}
					message="Super Administrator Privileges Active"
					description="This role or user has Super Administrator privileges. All permissions are automatically granted and cannot be restricted."
				/>
			)}
			<PermissionMatrixToolbar
				title={title}
				isAdmin={isAdmin}
				selectedCount={selectedCount}
				totalCount={allItems.length}
				disabled={disabled}
				isIndeterminate={isIndeterminate}
				isAllSelected={isAllSelected}
				onSelectAll={handleSelectAll}
			/>
			<Table<ModuleRow>
				columns={columns}
				dataSource={moduleRows}
				rowKey="key"
				pagination={false}
				bordered
				size="small"
				style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #edf0f5' }}
			/>
		</div>
	);
}
