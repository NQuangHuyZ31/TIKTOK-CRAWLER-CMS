import React from 'react';
import { Card, Form, Radio, Divider, Alert, Space } from 'antd';
import { SafetyCertificateOutlined, KeyOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import RoleSelector from '../RoleSelector';
import PermissionMatrixSelector from '../PermissionMatrixSelector';
import type { UserRole } from '../../Action/user';

export interface UserPermissionsCardProps {
    form: FormInstance;
    permissionType: string;
    rolesCatalog: UserRole[];
}

export default function UserPermissionsCard({ form, permissionType, rolesCatalog }: UserPermissionsCardProps) {
    const handleModeChange = (e: any) => {
        const nextType = e.target.value;
        if (nextType === 'role') {
            form.setFieldsValue({
                permission_type: 'role',
                permissions: [],
                roles: form.getFieldValue('roles')?.length > 0 ? form.getFieldValue('roles') : ['editor'],
            });
        } else {
            form.setFieldsValue({
                permission_type: 'user',
                roles: [],
            });
        }
    };

    return (
        <Card
            title="3. Access Privileges & Permission Mechanism"
            bordered={false}
            style={{
                borderRadius: 12,
                border: '1px solid #edf0f5',
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
        >
            <Form.Item
                name="permission_type"
                label="Authorization Mode (Choose one mutually exclusive mode)"
                rules={[{ required: true, message: 'Please select an authorization mode.' }]}
                extra="Select an independent authorization model: Role-based permissions or Direct User permissions. These two mechanisms are strictly mutually exclusive and never merged."
            >
                <Radio.Group buttonStyle="solid" size="middle" onChange={handleModeChange}>
                    <Radio.Button value="role" style={{ padding: '0 18px', height: 40, lineHeight: '38px' }}>
                        <Space>
                            <SafetyCertificateOutlined />
                            <span>Role-based Permissions</span>
                        </Space>
                    </Radio.Button>
                    <Radio.Button value="user" style={{ padding: '0 18px', height: 40, lineHeight: '38px' }}>
                        <Space>
                            <KeyOutlined />
                            <span>Direct User Permissions</span>
                        </Space>
                    </Radio.Button>
                </Radio.Group>
            </Form.Item>

            <Divider style={{ margin: '16px 0 24px' }} />

            {permissionType === 'role' ? (
                <div>
                    <Alert
                        type="info"
                        showIcon
                        message="Mode: Role-based Authorization"
                        description="This user inherits all access privileges granted by the assigned system role. Individual custom permissions do not apply."
                        style={{ marginBottom: 20, borderRadius: 8 }}
                    />
                    <Form.Item
                        name="roles"
                        label="Assign System Role"
                        rules={[{ required: true, message: 'Please select a system role.' }]}
                    >
                        <RoleSelector availableRoles={rolesCatalog} />
                    </Form.Item>
                </div>
            ) : (
                <div>
                    <Alert
                        type="warning"
                        showIcon
                        message="Mode: Direct User Authorization"
                        description="This user does not belong to any fixed role. All privileges (View/Create/Edit/Delete) are configured directly per module below."
                        style={{ marginBottom: 20, borderRadius: 8 }}
                    />
                    <Form.Item
                        name="permissions"
                        label="Direct Module Privileges Configuration"
                        extra="Select specific granular privileges this user is allowed to perform for each module."
                    >
                        <PermissionMatrixSelector isAdmin={false} />
                    </Form.Item>
                </div>
            )}
        </Card>
    );
}
