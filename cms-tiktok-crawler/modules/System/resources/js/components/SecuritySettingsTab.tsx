import React from 'react';
import { Card, Col, Form, InputNumber, Row, Switch, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function SecuritySettingsTab() {
    return (
        <Card
            bordered={false}
            title={
                <span>
                    <LockOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
                    Security & Session Policies
                </span>
            }
        >
            <Row gutter={[24, 16]}>
                <Col span={24} md={12}>
                    <Form.Item
                        name="session_lifetime"
                        label="Session Lifetime (Minutes)"
                        rules={[{ required: true, message: 'Session lifetime is required' }]}
                        extra="Duration before an inactive admin session expires."
                    >
                        <InputNumber min={15} max={10080} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="max_login_attempts"
                        label="Max Consecutive Failed Logins"
                        rules={[{ required: true, message: 'Max login attempts required' }]}
                        extra="Threshold triggering temporary IP rate-limiting."
                    >
                        <InputNumber min={3} max={20} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="allow_registration"
                        label="Allow Public Account Registration"
                        valuePropName="checked"
                        extra="When disabled, new users can only be invited by administrators."
                    >
                        <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}
