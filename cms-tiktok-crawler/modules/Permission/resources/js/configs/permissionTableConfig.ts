import type { TableColumn } from '@core/components/Table';
import type { PermissionItem } from '../Action/permission';

export const permissionTableColumns: TableColumn<PermissionItem>[] = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 70,
        align: 'center',
    },
    {
        title: 'Permission Name',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
    },
    {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        width: 220,
    },
    {
        title: 'Module',
        dataIndex: 'module',
        key: 'module',
        width: 140,
        align: 'center',
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: 120,
        align: 'center',
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        defaultValue: '-',
    },
    {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150,
        align: 'center',
    },
];
