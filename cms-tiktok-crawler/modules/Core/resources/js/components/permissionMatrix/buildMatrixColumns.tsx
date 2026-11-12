import React from 'react';
import { Checkbox, Space, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ModuleRow, PermissionItem } from './permissionMatrixTypes';

const { Text } = Typography;

export function buildMatrixColumns({
	displayActions,
	disabled = false,
	isAdmin = false,
	isSelected,
	onTogglePermission,
	onToggleModule,
}: {
	displayActions: string[];
	disabled?: boolean;
	isAdmin?: boolean;
	isSelected: (item: PermissionItem) => boolean;
	onTogglePermission: (item: PermissionItem, checked: boolean) => void;
	onToggleModule: (row: ModuleRow, checked: boolean) => void;
}): ColumnsType<ModuleRow> {
	const cols: ColumnsType<ModuleRow> = [
		{
			title: 'Module',
			dataIndex: 'label',
			key: 'label',
			width: 240,
			render: (_: any, record: ModuleRow) => (
				<Space size={8}>
					<span style={{ color: '#EC008C', fontSize: 16 }}>{record.icon}</span>
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

	displayActions.forEach((actionKey) => {
		const actionLabel = actionKey.charAt(0).toUpperCase() + actionKey.slice(1);
		cols.push({
			title: <div style={{ textAlign: 'center' }}><span>{actionLabel}</span></div>,
			key: actionKey,
			width: 100,
			align: 'center',
			render: (_: any, record: ModuleRow) => {
				const perm = record.actions[actionKey];
				if (!perm) {
					return <Text type="secondary" style={{ opacity: 0.35 }}>—</Text>;
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
						<Checkbox checked={checked} disabled={disabled || isAdmin} onChange={(e) => onTogglePermission(perm, e.target.checked)} />
					</Tooltip>
				);
			},
		});
	});

	cols.push({
		title: <div style={{ textAlign: 'center' }}><span>All</span></div>,
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
					<Checkbox checked={isAdmin || isRowAllChecked} indeterminate={!isAdmin && isRowIndeterminate} disabled={disabled || isAdmin} onChange={(e) => onToggleModule(record, e.target.checked)} />
				</Tooltip>
			);
		},
	});

	return cols;
}
