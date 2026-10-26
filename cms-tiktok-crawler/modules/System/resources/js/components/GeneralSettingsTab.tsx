import React from 'react';
import { Card, Col, Form, Input, Row, Select, Switch, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

export default function GeneralSettingsTab() {
    return (
        <Card
            bordered={false}
            title={
                <span>
                    <SettingOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                    General Platform Configurations
                </span>
            }
        >
            <Row gutter={[24, 16]}>
                <Col span={24} md={12}>
                    <Form.Item
                        name="site_name"
                        label="Platform Brand Name"
                        rules={[{ required: true, message: 'Platform name is required' }]}
                    >
                        <Input placeholder="TikTok Crawler CMS" />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="contact_email"
                        label="Administrative Contact Email"
                        rules={[
                            { required: true, message: 'Contact email is required' },
                            { type: 'email', message: 'Enter a valid email address' },
                        ]}
                    >
                        <Input placeholder="admin@urekamedia.com" />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="timezone"
                        label="System Display Timezone"
                        rules={[{ required: true, message: 'Timezone is required' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Select timezone"
                            options={[
                                { label: 'Asia/Ho_Chi_Minh (UTC+07:00)', value: 'Asia/Ho_Chi_Minh' },
                                { label: 'Asia/Bangkok (UTC+07:00)', value: 'Asia/Bangkok' },
                                { label: 'Asia/Singapore (UTC+08:00)', value: 'Asia/Singapore' },
                                { label: 'Asia/Tokyo (UTC+09:00)', value: 'Asia/Tokyo' },
                                { label: 'UTC (UTC+00:00)', value: 'UTC' },
                                { label: 'America/New_York (UTC-05:00)', value: 'America/New_York' },
                                { label: 'Europe/London (UTC+00:00)', value: 'Europe/London' },
                            ]}
                        />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="maintenance_mode"
                        label="Maintenance Mode"
                        valuePropName="checked"
                        extra="When active, non-admin accounts will see a maintenance screen."
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Disabled" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item name="site_description" label="Platform Description & Subtitle">
                        <TextArea
                            rows={3}
                            placeholder="High-performance automated TikTok data extraction platform..."
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}
