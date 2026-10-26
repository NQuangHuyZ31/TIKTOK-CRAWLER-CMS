import React, { useEffect, useState } from 'react';
import { Alert, Form, Input, Modal, App as AntdApp } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import PermissionMatrix from '@core/components/PermissionMatrix';
import { createRole, updateRole, type PermissionItem, type RoleItem } from '../Action/role';

const { TextArea } = Input;

export interface RoleFormModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    role: RoleItem | null;
    availablePermissions: Record<string, PermissionItem[]>;
}

export default function RoleFormModal({
    open,
    onClose,
    onSuccess,
    role,
    availablePermissions,
}: RoleFormModalProps) {
    const { message } = AntdApp.useApp();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const isEdit = Boolean(role);
    const isSuperAdmin = role?.slug === 'admin';

    useEffect(() => {
        if (open) {
            setErrorMsg(null);
            if (role) {
                const permIds =
                    role.permission_ids ??
                    (role.permissions ? role.permissions.map((p) => p.id) : []);
                setSelectedPermissions(permIds);
                form.setFieldsValue({
                    name: role.name,
                    slug: role.slug,
                    description: role.description,
                });
            } else {
                setSelectedPermissions([]);
                form.resetFields();
            }
        }
    }, [open, role, form]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEdit) {
            const val = e.target.value;
            const generatedSlug = val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            form.setFieldsValue({ slug: generatedSlug });
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setErrorMsg(null);

            const payload = {
                ...values,
                permissions: selectedPermissions,
            };

            if (isEdit && role) {
                await updateRole(role.id, payload);
                message.success(`Role '${values.name}' updated successfully.`);
            } else {
                await createRole(payload);
                message.success(`Role '${values.name}' created successfully.`);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to save role. Please check the inputs.';
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={
                <span>
                    <SafetyCertificateOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                    {isEdit ? `Edit Role: ${role?.name}` : 'Create New System Role'}
                </span>
            }
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={submitting}
            width={850}
            destroyOnClose
            style={{ top: 20 }}
            okText={isEdit ? 'Update Role' : 'Create Role'}
        >
            {errorMsg && (
                <Alert
                    type="error"
                    message={errorMsg}
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {isSuperAdmin && (
                <Alert
                    type="info"
                    message="Protected System Role"
                    description="The Super Administrator role possesses all system permissions by default. Its slug cannot be modified."
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Role Display Name"
                    rules={[{ required: true, message: 'Please provide a role name' }]}
                >
                    <Input
                        placeholder="e.g. Data Auditor, Content Reviewer"
                        onChange={handleNameChange}
                    />
                </Form.Item>

                <Form.Item
                    name="slug"
                    label="Role Slug"
                    rules={[{ required: true, message: 'Role slug is required' }]}
                    extra="Unique system identifier, e.g. 'auditor', 'content-reviewer'."
                >
                    <Input
                        placeholder="e.g. auditor"
                        disabled={isSuperAdmin}
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <TextArea
                        rows={2}
                        placeholder="Brief summary of duties and access level granted by this role..."
                    />
                </Form.Item>

                <div style={{ marginTop: 8 }}>
                    <PermissionMatrix
                        permissions={availablePermissions}
                        selectedIds={selectedPermissions}
                        onChange={setSelectedPermissions}
                        disabled={isSuperAdmin}
                    />
                </div>
            </Form>
        </Modal>
    );
}
