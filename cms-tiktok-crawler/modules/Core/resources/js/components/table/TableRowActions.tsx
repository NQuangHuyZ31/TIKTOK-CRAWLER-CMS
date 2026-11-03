import React from 'react';
import { Button, Popconfirm, Space, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import PermissionGate from '../PermissionGate';

export interface TableRowActionsProps<T = any> {
	record: T;
	onEdit?: (record: T) => void;
	onDelete?: (record: T) => void;
	canEdit?: boolean | ((record: T) => boolean);
	canDelete?: boolean | ((record: T) => boolean);
	deleteConfirmTitle?: string | ((record: T) => React.ReactNode);
	extraActions?: (record: T) => React.ReactNode;
	permissionModule?: string;
}

export default function TableRowActions<T = any>({
	record,
	onEdit,
	onDelete,
	canEdit = true,
	canDelete = true,
	deleteConfirmTitle = 'Are you sure you want to delete this record?',
	extraActions,
	permissionModule,
}: TableRowActionsProps<T>) {
	const isEditable = typeof canEdit === 'function' ? canEdit(record) : canEdit;
	const isDeletable = typeof canDelete === 'function' ? canDelete(record) : canDelete;
	const confirmDescription = typeof deleteConfirmTitle === 'function' ? deleteConfirmTitle(record) : deleteConfirmTitle;

	const editButton = (
		<Tooltip title="Edit">
			<Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} onClick={() => onEdit?.(record)} />
		</Tooltip>
	);

	const deleteButton = (
		<Popconfirm
			title="Delete"
			description={confirmDescription}
			onConfirm={() => onDelete?.(record)}
			okText="Delete"
			cancelText="Cancel"
			okButtonProps={{ danger: true }}
		>
			<Tooltip title="Delete">
				<Button type="text" danger size="small" icon={<DeleteOutlined />} />
			</Tooltip>
		</Popconfirm>
	);

	return (
		<Space size={4}>
			{extraActions && extraActions(record)}

			{onEdit && isEditable && (
				permissionModule ? (
					<PermissionGate module={permissionModule} action="edit">
						{editButton}
					</PermissionGate>
				) : (
					editButton
				)
			)}

			{onDelete && isDeletable && (
				permissionModule ? (
					<PermissionGate module={permissionModule} action="delete">
						{deleteButton}
					</PermissionGate>
				) : (
					deleteButton
				)
			)}
		</Space>
	);
}
