import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, Row, Space, Typography, App as AntdApp } from 'antd';
import {
    KeyOutlined,
    PlusOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import CardKPI from '@core/components/CardKPI';
import PageHeader from '@core/components/PageHeader';
import {
    deleteRole,
    getAvailablePermissions,
    getRoles,
    type PermissionItem,
    type RoleItem,
} from '../Action/role';
import RoleFormModal from '../components/RoleFormModal';
import RoleTableList from '../components/RoleTableList';

const { Text } = Typography;

export default function RolesPage() {
    const { message } = AntdApp.useApp();
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [permissions, setPermissions] = useState<Record<string, PermissionItem[]>>({});
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

    const loadPermissions = async () => {
        try {
            const res = await getAvailablePermissions();
            setPermissions(res?.data ?? {});
        } catch {
            // Ignore if permissions endpoint fails
        }
    };

    const loadRoles = useCallback(
        async (page = 1, perPage = 10, search = '') => {
            setLoading(true);
            try {
                const res = await getRoles({
                    page,
                    per_page: perPage,
                    search: search.trim() || undefined,
                });
                const list = res?.data ?? [];
                setRoles(list);

                const meta = (res as any)?.meta ?? {};
                setPagination({
                    current_page: meta.current_page ?? page,
                    per_page: meta.per_page ?? perPage,
                    total: meta.total ?? list.length,
                });
            } catch (err: any) {
                message.error(err?.message || 'Failed to retrieve roles list');
            } finally {
                setLoading(false);
            }
        },
        [message]
    );

    useEffect(() => {
        loadRoles(1, 10, searchKeyword);
        loadPermissions();
    }, []);

    const totalPermissionsCount = useMemo(() => {
        return Object.values(permissions).reduce((acc, list) => acc + list.length, 0);
    }, [permissions]);

    const handleSearch = (val: string) => {
        setSearchKeyword(val);
        loadRoles(1, pagination.per_page, val);
    };

    const handleOpenCreate = () => {
        setSelectedRole(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (role: RoleItem) => {
        setSelectedRole(role);
        setModalOpen(true);
    };

    const handleDelete = async (role: RoleItem) => {
        try {
            await deleteRole(role.id);
            message.success(`Role '${role.name}' deleted successfully.`);
            loadRoles(pagination.current_page, pagination.per_page, searchKeyword);
        } catch (err: any) {
            message.error(err?.response?.data?.message || err?.message || 'Failed to delete role');
        }
    };

    return (
        <div>
            <PageHeader
                title="Roles & Access Control (RBAC)"
                subtitle="Configure system user access levels and granular module permissions"
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'Roles', href: '/admin/role/roles' },
                    { title: 'Role Management' },
                ]}
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => loadRoles(pagination.current_page, pagination.per_page, searchKeyword)}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleOpenCreate}
                        >
                            Create Role
                        </Button>
                    </Space>
                }
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24} sm={8}>
                    <CardKPI
                        title="Defined Roles"
                        value={pagination.total || roles.length}
                        icon={<UsergroupAddOutlined />}
                        color="#1677ff"
                        subtext="Active system access profiles"
                        loading={loading}
                    />
                </Col>

                <Col span={24} sm={8}>
                    <CardKPI
                        title="System Permissions"
                        value={totalPermissionsCount || 12}
                        icon={<KeyOutlined />}
                        color="#52c41a"
                        subtext="Module actions mapped in RBAC matrix"
                        loading={loading}
                    />
                </Col>

                <Col span={24} sm={8}>
                    <CardKPI
                        title="Administrator Access"
                        value="Super Admin"
                        icon={<SafetyCertificateOutlined />}
                        color="#faad14"
                        subtext="Protected system superuser role"
                        loading={loading}
                    />
                </Col>
            </Row>

            <Card
                bordered={false}
                title={
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: 16 }}>
                            Configured System Roles
                        </Text>
                        <Input
                            placeholder="Search by role name or slug..."
                            prefix={<SearchOutlined />}
                            allowClear
                            style={{ width: 280 }}
                            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                            onChange={(e) => {
                                if (!e.target.value) handleSearch('');
                            }}
                        />
                    </Space>
                }
            >
                <RoleTableList
                    data={roles}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={(p, ps) => loadRoles(p, ps, searchKeyword)}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                />
            </Card>

            <RoleFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => loadRoles(pagination.current_page, pagination.per_page, searchKeyword)}
                role={selectedRole}
                availablePermissions={permissions}
            />
        </div>
    );
}
