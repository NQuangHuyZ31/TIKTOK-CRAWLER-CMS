import React from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import {
    CrownOutlined,
    DeleteOutlined,
    EditOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import TableComponent from '@core/components/Table';
import type { TableColumn } from '@core/components/Table';
import { roleTableColumns } from '../configs/roleTableConfig';
import type { RoleItem } from '../Action/role';

const { Text } = Typography;

export interface RoleTableListProps {
    data: RoleItem[];
    loading?: boolean;
    pagination?: any;
    onPageChange?: (page: number, pageSize: number) => void;
    onEdit: (role: RoleItem) => void;
    onDelete: (role: RoleItem) => void;
}

export default function RoleTableList({
    data,
    loading = false,
    pagination,
    onPageChange,
    onEdit,
    onDelete,
}: RoleTableListProps) {
    const renderColumns = {
        name: (val: string, record: RoleItem) => (
            <Space>
                {record.slug === 'admin' ? (
                    <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />
                ) : (
                    <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                )}
                <Text strong>{val}</Text>
            </Space>
        ),
        slug: (val: string) => (
            <Tag color={val === 'admin' ? 'gold' : 'blue'} style={{ fontFamily: 'monospace' }}>
                {val}
            </Tag>
        ),
        permissions_count: (val: number, record: RoleItem) => {
            const count = val ?? record.permissions?.length ?? 0;
            return (
                <Tag color={count > 0 ? 'geekblue' : 'default'}>
                    {count} {count === 1 ? 'Permission' : 'Permissions'}
                </Tag>
            );
        },
        created_at: (val: string) => (
            <Text type="secondary" style={{ fontSize: 13 }}>
                {val ? new Date(val).toLocaleDateString() : '-'}
            </Text>
        ),
    };

    const actionColumns: TableColumn<RoleItem>[] = [
        {
            title: 'Actions',
            key: 'actions',
            width: 140,
            align: 'center',
            render: (_: any, record: RoleItem) => {
                const isSuperAdmin = record.slug === 'admin';
                return (
                    <Space size="small">
                        <Tooltip title="Edit Role & Permissions">
                            <Button
                                size="small"
                                type="primary"
                                ghost
                                icon={<EditOutlined />}
                                onClick={() => onEdit(record)}
                            />
                        </Tooltip>

                        <Tooltip
                            title={
                                isSuperAdmin
                                    ? 'Super Administrator cannot be deleted'
                                    : 'Delete Role'
                            }
                        >
                            <Popconfirm
                                title="Delete Role"
                                description={`Are you sure you want to permanently delete role '${record.name}'?`}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                                disabled={isSuperAdmin}
                                onConfirm={() => onDelete(record)}
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={isSuperAdmin}
                                />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <TableComponent
            columns={roleTableColumns}
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={onPageChange}
            renderColumns={renderColumns}
            appendColumns={actionColumns}
            rowKey="id"
        />
    );
}
