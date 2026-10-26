import React, { useMemo } from 'react';
import { Table, Checkbox, Typography, Tag, Space, Tooltip, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AppstoreOutlined, RobotOutlined, ApiOutlined, SettingOutlined, UserOutlined, SafetyCertificateOutlined, KeyOutlined, LockOutlined, CheckSquareOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface PermissionItem {
	id: number;
	name: string;
	slug: string;
	module?: string;
	action?: string;
	description?: string;
}

export type PermissionInputType = Record<string, PermissionItem[]> | Array<{ module: string; items: PermissionItem[] }> | PermissionItem[];

export interface PermissionMatrixProps {
	/** Permission dataset in grouped array, flat array, or module-keyed record */
	permissions?: PermissionInputType;
	/** Currently selected identifiers (slug strings or numeric IDs) */
	value?: (string | number)[];
	/** Backward compatibility with numeric ID selections (e.g., RoleFormModal) */
	selectedIds?: number[];
	/** Callback triggered when selection changes */
	onChange?: (selected: any[]) => void;
	/** Output mode: 'slug' returns string[], 'id' returns number[], 'auto' detects mode */
	mode?: 'slug' | 'id' | 'auto';
	/** Whether matrix interactions are disabled */
	disabled?: boolean;
	/** Whether target subject has Super Administrator privilege */
	isAdmin?: boolean;
	/** Custom title display */
	title?: string;
}

interface ModuleRow {
	key: string;
	module: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	actions: Record<string, PermissionItem>;
	items: PermissionItem[];
}

const MODULE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
	core: { label: 'Core / Dashboard', icon: <AppstoreOutlined />, color: 'blue' },
	crawler: { label: 'Crawler Engine', icon: <RobotOutlined />, color: 'purple' },
	tiktok_account: { label: 'TikTok Accounts', icon: <ApiOutlined />, color: 'green' },
	system: { label: 'System Settings', icon: <SettingOutlined />, color: 'gold' },
	user: { label: 'User Management', icon: <UserOutlined />, color: 'cyan' },
	role: { label: 'Role Management', icon: <SafetyCertificateOutlined />, color: 'geekblue' },
	permission: { label: 'Permission Management', icon: <KeyOutlined />, color: 'magenta' },
	auth: { label: 'Authentication', icon: <LockOutlined />, color: 'orange' },
};

function formatModuleLabel(mod: string): string {
	return mod
		.split(/[_-]/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

/**
 * Normalizes any backend permission catalog into a uniform ModuleRow array.
 * Supports:
 *  - grouped_permissions: [{ module: 'core', items: [...] }, ...]
 *  - flat array: [{ id: 1, slug: 'core.view', module: 'core', action: 'view' }, ...]
 *  - keyed map: { core: [...], system: [...] }
 */
function normalizePermissions(input?: PermissionInputType): ModuleRow[] {
	if (!input) return [];

	const grouped: Record<string, PermissionItem[]> = {};

	if (Array.isArray(input)) {
		input.forEach((item: any) => {
			if (!item || typeof item !== 'object') return;

			// Format 1: { module: 'core', items: [...] }
			if ('module' in item && Array.isArray(item.items)) {
				const modKey = String(item.module).toLowerCase();
				if (!grouped[modKey]) grouped[modKey] = [];
				item.items.forEach((subItem: PermissionItem) => {
					grouped[modKey].push(subItem);
				});
			}
			// Format 2: Flat permission item { id, slug, module, action }
			else if ('slug' in item) {
				const modKey = (item.module ? String(item.module) : item.slug.split('.')[0] || 'other').toLowerCase();
				if (!grouped[modKey]) grouped[modKey] = [];
				grouped[modKey].push(item as PermissionItem);
			}
		});
	} else if (typeof input === 'object') {
		// Format 3: Record<string, PermissionItem[]>
		Object.entries(input).forEach(([modKey, list]) => {
			if (Array.isArray(list)) {
				grouped[modKey.toLowerCase()] = [...list];
			}
		});
	}

	return Object.entries(grouped).map(([modKey, items]) => {
		const conf = MODULE_CONFIG[modKey] || {
			label: formatModuleLabel(modKey),
			icon: <AppstoreOutlined />,
			color: 'default',
		};

		const actionsMap: Record<string, PermissionItem> = {};
		items.forEach((p) => {
			const act = (p.action || p.slug.split('.')[1] || '').toLowerCase();
			if (act) {
				actionsMap[act] = p;
			}
		});

		return {
			key: modKey,
			module: modKey,
			label: conf.label,
			icon: conf.icon,
			color: conf.color,
			actions: actionsMap,
			items,
		};
	});
}

/**
 * Universal PermissionMatrix component built with Ant Design Table.
 * Seamlessly integrates with Form.Item (value/onChange) or standalone state (selectedIds/onChange).
 */
export default function PermissionMatrix({ permissions, value, selectedIds, onChange, mode = 'auto', disabled = false, isAdmin = false, title = 'Module Permission Matrix' }: PermissionMatrixProps) {
	// Normalize raw dataset
	const moduleRows = useMemo(() => normalizePermissions(permissions), [permissions]);

	// Flatten all items for total counts & bulk operations
	const allItems = useMemo(() => {
		const list: PermissionItem[] = [];
		moduleRows.forEach((r) => list.push(...r.items));
		return list;
	}, [moduleRows]);

	// Active selection array
	const rawSelected = useMemo(() => {
		if (value !== undefined && Array.isArray(value)) return value;
		if (selectedIds !== undefined && Array.isArray(selectedIds)) return selectedIds;
		return [];
	}, [value, selectedIds]);

	// Determine target output mode
	const activeMode = useMemo<'slug' | 'id'>(() => {
		if (mode === 'slug') return 'slug';
		if (mode === 'id') return 'id';
		if (selectedIds !== undefined) return 'id';
		if (rawSelected.length > 0 && typeof rawSelected[0] === 'number') return 'id';
		if (rawSelected.length > 0 && typeof rawSelected[0] === 'string') return 'slug';
		return 'slug';
	}, [mode, selectedIds, rawSelected]);

	// Lookup set for O(1) membership check
	const selectedLookup = useMemo(() => {
		const set = new Set<string | number>();
		rawSelected.forEach((s) => {
			set.add(s);
			if (typeof s === 'number') {
				set.add(String(s));
			}
		});
		return set;
	}, [rawSelected]);

	const isSelected = (item: PermissionItem): boolean => {
		if (isAdmin) return true;
		return selectedLookup.has(item.id) || selectedLookup.has(item.slug) || selectedLookup.has(String(item.id));
	};

	// Calculate actions present in the dataset
	const displayActions = useMemo(() => {
		const standardActions = ['view', 'create', 'edit', 'delete'];
		const allActionsSet = new Set<string>();
		moduleRows.forEach((row) => {
			Object.keys(row.actions).forEach((act) => allActionsSet.add(act));
		});

		const ordered = standardActions.filter((a) => allActionsSet.has(a));
		allActionsSet.forEach((a) => {
			if (!ordered.includes(a)) {
				ordered.push(a);
			}
		});

		return ordered.length > 0 ? ordered : standardActions;
	}, [moduleRows]);

	// Master selection states
	const allIdentifiers = useMemo(() => {
		return allItems.map((p) => (activeMode === 'slug' ? p.slug : p.id));
	}, [allItems, activeMode]);

	const isAllSelected = useMemo(() => {
		if (isAdmin) return true;
		return allItems.length > 0 && allItems.every((p) => isSelected(p));
	}, [allItems, isAdmin, selectedLookup]);

	const selectedCount = useMemo(() => {
		if (isAdmin) return allItems.length;
		return allItems.filter((p) => isSelected(p)).length;
	}, [allItems, isAdmin, selectedLookup]);

	const isIndeterminate = useMemo(() => {
		if (isAdmin) return false;
		return selectedCount > 0 && selectedCount < allItems.length;
	}, [selectedCount, allItems.length, isAdmin]);

	// Handlers
	const handleSelectAll = (checked: boolean) => {
		if (disabled || isAdmin) return;
		if (checked) {
			onChange?.(allIdentifiers);
		} else {
			onChange?.([]);
		}
	};

	const handleTogglePermission = (item: PermissionItem, checked: boolean) => {
		if (disabled || isAdmin) return;
		const targetId = activeMode === 'slug' ? item.slug : item.id;
		let next: any[];

		if (checked) {
			next = [...rawSelected, targetId];
		} else {
			next = rawSelected.filter((val) => {
				return val !== item.slug && val !== item.id && String(val) !== String(item.id);
			});
		}
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

	// Build Table Columns dynamically
	const columns: ColumnsType<ModuleRow> = useMemo(() => {
		const cols: ColumnsType<ModuleRow> = [
			{
				title: 'Module',
				dataIndex: 'label',
				key: 'label',
				width: 240,
				render: (_: any, record: ModuleRow) => (
					<Space size={8}>
						<span style={{ color: '#1677ff', fontSize: 16 }}>{record.icon}</span>
						<Text strong style={{ fontSize: 13 }}>
							{record.label}
						</Text>
						<Tag color={record.color} style={{ fontSize: 11, marginLeft: 4 }}>
							{record.module}
						</Tag>
					</Space>
				),
			},
		];

		// Add an action column for each active action
		displayActions.forEach((actionKey) => {
			const actionLabel = actionKey.charAt(0).toUpperCase() + actionKey.slice(1);
			cols.push({
				title: (
					<div style={{ textAlign: 'center' }}>
						<span>{actionLabel}</span>
					</div>
				),
				key: actionKey,
				width: 100,
				align: 'center',
				render: (_: any, record: ModuleRow) => {
					const perm = record.actions[actionKey];
					if (!perm) {
						return (
							<Text type="secondary" style={{ opacity: 0.35 }}>
								—
							</Text>
						);
					}

					const checked = isSelected(perm);
					return (
						<Tooltip
							title={
								<span>
									<strong>{perm.slug}</strong>
									<br />
									{perm.description || perm.name}
								</span>
							}
							placement="top"
						>
							<Checkbox checked={checked} disabled={disabled || isAdmin} onChange={(e) => handleTogglePermission(perm, e.target.checked)} />
						</Tooltip>
					);
				},
			});
		});

		// Add 'All' column for row-level toggle
		cols.push({
			title: (
				<div style={{ textAlign: 'center' }}>
					<span>All</span>
				</div>
			),
			key: 'toggle_all',
			width: 80,
			align: 'center',
			render: (_: any, record: ModuleRow) => {
				const totalInRow = record.items.length;
				const selectedInRow = record.items.filter((p) => isSelected(p)).length;
				const isRowAllChecked = totalInRow > 0 && selectedInRow === totalInRow;
				const isRowIndeterminate = selectedInRow > 0 && selectedInRow < totalInRow;

				return (
					<Tooltip title={`Toggle all permissions for ${record.label}`} placement="top">
						<Checkbox checked={isAdmin || isRowAllChecked} indeterminate={!isAdmin && isRowIndeterminate} disabled={disabled || isAdmin} onChange={(e) => handleToggleModule(record, e.target.checked)} />
					</Tooltip>
				);
			},
		});

		return cols;
	}, [displayActions, disabled, isAdmin, selectedLookup, isSelected]);

	return (
		<div style={{ marginTop: 8, width: '100%' }}>
			{/* Super Admin Notice */}
			{isAdmin && (
				<Alert
					type="info"
					showIcon
					style={{ marginBottom: 12, borderRadius: 8 }}
					message="Super Administrator Privileges Active"
					description="This role or user has Super Administrator privileges. All permissions are automatically granted and cannot be restricted."
				/>
			)}

			{/* Matrix Header Toolbar */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 12,
					marginBottom: 12,
					padding: '10px 14px',
					background: '#f8fafc',
					borderRadius: 8,
					border: '1px solid #e2e8f0',
				}}
			>
				<Space wrap>
					<CheckSquareOutlined style={{ color: '#1677ff', fontSize: 16 }} />
					<Text strong style={{ fontSize: 14 }}>
						{title}
					</Text>
					{isAdmin ? (
						<Tag color="gold">Super Admin (All Privileges)</Tag>
					) : (
						<Tag color="geekblue">
							{selectedCount} / {allItems.length} Selected
						</Tag>
					)}
				</Space>

				<Space wrap>
					{!disabled && !isAdmin && (
						<Checkbox indeterminate={isIndeterminate} checked={isAllSelected} onChange={(e) => handleSelectAll(e.target.checked)}>
							Select All Permissions
						</Checkbox>
					)}
				</Space>
			</div>

			{/* Matrix Ant Design Table */}
			<Table<ModuleRow>
				columns={columns}
				dataSource={moduleRows}
				rowKey="key"
				pagination={false}
				bordered
				size="small"
				style={{
					background: '#fff',
					borderRadius: 8,
					overflow: 'hidden',
					border: '1px solid #edf0f5',
				}}
			/>
		</div>
	);
}
