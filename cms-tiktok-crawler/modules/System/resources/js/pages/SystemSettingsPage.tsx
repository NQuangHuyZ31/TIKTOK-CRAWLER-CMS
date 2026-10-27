import React, { useEffect, useState } from 'react';
import { Button, Form, Space, Tabs } from 'antd';
import {
    CloudServerOutlined,
    LockOutlined,
    ReloadOutlined,
    RobotOutlined,
    SaveOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import PageHeader from '@core/components/PageHeader';
import useAction from '@core/hooks/useAction';
import {
    batchUpdateSettings,
    getGroupedSettings,
    getSystemInfo,
    type SystemInfoData,
} from '../Action/systemSetting';
import CrawlerSettingsTab from '../components/CrawlerSettingsTab';
import GeneralSettingsTab from '../components/GeneralSettingsTab';
import SecuritySettingsTab from '../components/SecuritySettingsTab';
import SystemInfoTab from '../components/SystemInfoTab';

export default function SystemSettingsPage() {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const { act, loading: saving } = useAction();
    const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const [settingsRes, infoRes] = await Promise.allSettled([
                getGroupedSettings(),
                getSystemInfo(),
            ]);

            if (settingsRes.status === 'fulfilled') {
                const grouped = settingsRes.value?.data ?? {};
                // Flatten grouped settings into single form state
                const flattened: Record<string, any> = {};
                Object.values(grouped).forEach((groupMap) => {
                    Object.assign(flattened, groupMap);
                });
                form.setFieldsValue(flattened);
            }

            if (infoRes.status === 'fulfilled') {
                setSystemInfo(infoRes.value?.data ?? null);
            }
        } catch (err: any) {
            message.error(err?.message || 'Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        const values = await form.validateFields();
        await act(
            () => batchUpdateSettings(values, activeTab),
            'System configuration saved successfully.'
        );
    };

    const tabItems = [
        {
            key: 'general',
            label: (
                <span>
                    <SettingOutlined />
                    General Settings
                </span>
            ),
            children: <GeneralSettingsTab />,
        },
        {
            key: 'crawler',
            label: (
                <span>
                    <RobotOutlined />
                    Crawler Engine
                </span>
            ),
            children: <CrawlerSettingsTab />,
        },
        {
            key: 'security',
            label: (
                <span>
                    <LockOutlined />
                    Security & Access
                </span>
            ),
            children: <SecuritySettingsTab />,
        },
        {
            key: 'info',
            label: (
                <span>
                    <CloudServerOutlined />
                    System Diagnostics
                </span>
            ),
            children: (
                <SystemInfoTab
                    info={systemInfo}
                    loading={loading}
                    onRefresh={loadSettings}
                />
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="System Configuration"
                subtitle="Configure application parameters, crawler engine thresholds, security rules, and diagnostics"
                breadcrumbs={[
                    { title: 'Dashboard', href: '/admin/dashboard' },
                    { title: 'System', href: '/admin/system/settings' },
                    { title: 'Configuration' },
                ]}
                extra={
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadSettings}
                            loading={loading}
                        >
                            Reload
                        </Button>
                        {activeTab !== 'info' && (
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSave}
                                loading={saving}
                            >
                                Save Changes
                            </Button>
                        )}
                    </Space>
                }
            />

            <Form form={form} layout="vertical">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    type="card"
                    style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, border: '1px solid #edf0f5' }}
                />
            </Form>
        </div>
    );
}
