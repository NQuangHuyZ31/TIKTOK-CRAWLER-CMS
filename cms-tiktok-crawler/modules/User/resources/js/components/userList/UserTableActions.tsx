import React from 'react';
import { Link } from 'react-router-dom';
import { Space, Button, Popconfirm, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import PermissionGate from '@core/components/PermissionGate';
import type { UserItem } from '../../Action/user';

export interface UserTableActionsProps {
    record: UserItem;
    currentUserId?: number;
    onDelete: (id: number | string) => void;
    onResetPassword: (id: number | string) => void;
}

export default function UserTableActions({
    record,
    currentUserId,
    onDelete,
    onResetPassword,
}: UserTableActionsProps) {
    const isSelf = currentUserId === record.id;

    return (
        <Space size={4}>
            <PermissionGate module="user" action="view">
                <Tooltip title="View Details">
                    <Link to={`/user/${record.id}`}>
                        <Button size="small" type="text" icon={<EyeOutlined style={{ color: '#1677ff' }} />} />
                    </Link>
                </Tooltip>
            </PermissionGate>

            <PermissionGate module="user" action="edit">
                <Tooltip title="Edit User">
                    <Link to={`/user/${record.id}/edit`}>
                        <Button size="small" type="text" icon={<EditOutlined style={{ color: '#52c41a' }} />} />
                    </Link>
                </Tooltip>
            </PermissionGate>

            <PermissionGate module="user" action="delete">
                <Popconfirm
                    title="Delete user account"
                    description={`Are you sure you want to delete ${record.name}?`}
                    onConfirm={() => onDelete(record.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <Tooltip title="Delete">
                        <Button type="text" danger size="small" disabled={isSelf} icon={<DeleteOutlined />} />
                    </Tooltip>
                </Popconfirm>
            </PermissionGate>

            <PermissionGate module="user" roles={'admin'}>
                <Popconfirm
                    title="Reset password user"
                    description={`Are you sure you want to reset password ${record.name}?`}
                    onConfirm={() => onResetPassword(record.id)}
                    okText="Reset"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                >
                    <Tooltip title="Reset Password">
                        <Button type="text" size="small" icon={<KeyOutlined />} disabled={isSelf} />
                    </Tooltip>
                </Popconfirm>
            </PermissionGate>
        </Space>
    );
}
