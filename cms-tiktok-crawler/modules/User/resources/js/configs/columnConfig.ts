import type { TableColumn } from '@core/components/Table';

export const userColumnConfig: TableColumn[] = [
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 70,
        sorter: (a: any, b: any) => (a.id ?? 0) - (b.id ?? 0),
    },
    {
        title: 'User Profile',
        dataIndex: 'name',
        key: 'name',
    },
    {
        title: 'Assigned Role',
        dataIndex: 'roles',
        key: 'roles',
        width: 170,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 110,
    },
    {
        title: 'Phone',
        dataIndex: 'phone',
        key: 'phone',
        width: 130,
    },
    {
        title: 'Created At',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 160,
    },
    {
        key: 'action',
        title: 'Actions',
        width: 140,
        fixed: 'right',
    },
];

export default userColumnConfig;
