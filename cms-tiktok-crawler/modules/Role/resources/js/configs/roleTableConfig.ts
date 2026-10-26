import type { TableColumn } from '@core/components/Table';
import type { RoleItem } from '../Action/role';

export const roleTableColumns: TableColumn<RoleItem>[] = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 70,
        align: 'center',
    },
    {
        title: 'Role Name',
        dataIndex: 'name',
        key: 'name',
        width: 180,
    },
    {
        title: 'Slug',
        dataIndex: 'slug',
        key: 'slug',
        width: 160,
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
    },
    {
        title: 'Permissions',
        dataIndex: 'permissions_count',
        key: 'permissions_count',
        width: 140,
        align: 'center',
    },
    {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
    },
];
