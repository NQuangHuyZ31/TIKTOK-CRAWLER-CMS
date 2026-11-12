import React from 'react';
import { Card, Table, Tag, Typography, Space, theme } from 'antd';
import { CrownOutlined, SafetyCertificateOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { UserItem } from '../../Action/user';
import type { RoleBadgeConfig } from '../../configs/userConstants';

const { Title, Text, Paragraph } = Typography;

export interface UserPrivilegesCardProps {
    user: UserItem;
    roleCfg: RoleBadgeConfig;
}

export default function UserPrivilegesCard({ user, roleCfg }: UserPrivilegesCardProps) {
    const { token } = theme.useToken();
    const matrix = user.permissions_matrix || {};

    const matrixDataSource = Object.entries(matrix).map(([moduleKey, perm]: [string, any]) => ({
        key: perm.id ?? moduleKey,
        module: perm.module ?? moduleKey,
        view: Boolean(perm.view),
        edit: Boolean(perm.edit),
    }));

    const matrixColumns = [
        {
            title: 'System Module',
            dataIndex: 'module',
            key: 'module',
            width: '50%',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'View Access',
            dataIndex: 'view',
            key: 'view',
            align: 'center' as const,
            render: (val: boolean) =>
                val ? (
                    <Tag color="success" icon={<CheckCircleFilled />}>
                        Allowed
                    </Tag>
                ) : (
                    <Tag color="default" icon={<CloseCircleFilled />}>
                        Denied
                    </Tag>
                ),
        },
        {
            title: 'Edit Access',
            dataIndex: 'edit',
            key: 'edit',
            align: 'center' as const,
            render: (val: boolean) =>
                val ? (
                    <Tag color="blue" icon={<CheckCircleFilled />}>
                        Allowed
                    </Tag>
                ) : (
                    <Tag color="default" icon={<CloseCircleFilled />}>
                        Denied
                    </Tag>
                ),
        },
    ];

    return (
        <Card
            title="Role & Assigned Privileges"
            bordered={false}
            style={{
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
        >
            <div
                style={{
                    padding: 16,
                    borderRadius: 8,
                    background: roleCfg.bg,
                    border: `1px solid ${roleCfg.border}`,
                    marginBottom: 16,
                }}
            >
                <Space size={8} align="center">
                    {user.is_admin ? (
                        <CrownOutlined style={{ color: roleCfg.color, fontSize: 20 }} />
                    ) : (
                        <SafetyCertificateOutlined style={{ color: roleCfg.color, fontSize: 20 }} />
                    )}
                    <Text strong style={{ fontSize: 16, color: roleCfg.color }}>
                        {roleCfg.name}
                    </Text>
                </Space>
                <Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 13 }}>
                    {roleCfg.description}
                </Paragraph>
            </div>

            <Title level={5} style={{ marginBottom: 12 }}>
                Module Access Matrix
            </Title>
            <Table
                dataSource={matrixDataSource}
                columns={matrixColumns}
                pagination={false}
                size="small"
                bordered
                style={{ borderRadius: 8, overflow: 'hidden' }}
            />
        </Card>
    );
}
