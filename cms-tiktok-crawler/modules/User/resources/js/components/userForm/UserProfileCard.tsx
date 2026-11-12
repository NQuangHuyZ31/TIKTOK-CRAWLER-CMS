import React from 'react';
import { Card, Row, Col, Form, Input, Select, theme } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LinkOutlined } from '@ant-design/icons';
import { USER_FORM_STATUS_OPTIONS } from '../../configs/userConstants';

export default function UserProfileCard() {
    const { token } = theme.useToken();

    return (
        <Card
            title="1. Basic Profile Information"
            bordered={false}
            style={{
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
        >
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter the user full name.' }]}
                    >
                        <Input prefix={<UserOutlined style={{ color: '#8c8c8c' }} />} placeholder="e.g. Alex Johnson" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="email"
                        label="Email Address"
                        rules={[
                            { required: true, message: 'Please enter email address.' },
                            { type: 'email', message: 'Please enter a valid email.' },
                        ]}
                    >
                        <Input prefix={<MailOutlined style={{ color: '#8c8c8c' }} />} placeholder="alex@company.com" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Phone Number">
                        <Input prefix={<PhoneOutlined style={{ color: '#8c8c8c' }} />} placeholder="0912345678" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item
                        name="status"
                        label="Account Status"
                        rules={[{ required: true, message: 'Please select account status.' }]}
                    >
                        <Select options={USER_FORM_STATUS_OPTIONS} />
                    </Form.Item>
                </Col>

                <Col xs={24}>
                    <Form.Item name="avatar" label="Avatar Image URL (Optional)">
                        <Input prefix={<LinkOutlined style={{ color: '#8c8c8c' }} />} placeholder="https://..." />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}
