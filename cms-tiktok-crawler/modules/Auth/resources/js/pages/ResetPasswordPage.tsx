import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { LockOutlined, MailOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../Action/auth';
import { AUTH_ROUTES } from '../configs/authConfig';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
    const [form] = Form.useForm();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Initial values from state if navigated from ForgotPasswordPage
    const initialEmail = (location.state as any)?.email || '';
    const initialToken = (location.state as any)?.token || '';

    const handleSubmit = async (values: any) => {
        setError(null);
        setLoading(true);
        try {
            await resetPassword({
                email: values.email,
                token: values.token,
                password: values.password,
                password_confirmation: values.password_confirmation,
            });

            setIsSuccess(true);
            message.success('Password reset successfully! Please sign in with your new password.');
        } catch (e: any) {
            setError(e.message || 'Failed to reset password. Please verify your token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0b1120 0%, #172554 50%, #1e1b4b 100%)',
                padding: '24px',
            }}
        >
            <Card
                style={{
                    width: '100%',
                    maxWidth: 440,
                    borderRadius: 16,
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#ffffff',
                }}
                styles={{ body: { padding: '36px 32px' } }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                        }}
                    >
                        <LockOutlined style={{ fontSize: 26, color: '#ffffff' }} />
                    </div>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                        Set New Password
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Create a strong and secure new password
                    </Text>
                </div>

                {error && (
                    <Alert
                        type="error"
                        showIcon
                        message={error}
                        style={{ marginBottom: 20, borderRadius: 8 }}
                        closable
                        onClose={() => setError(null)}
                    />
                )}

                {isSuccess ? (
                    <div>
                        <Alert
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined style={{ fontSize: 20 }} />}
                            message="Password Reset Successful"
                            description="Your password has been changed. You can now log in with your new credentials."
                            style={{ marginBottom: 24, borderRadius: 8 }}
                        />
                        <Button
                            type="primary"
                            block
                            style={{ height: 44, borderRadius: 8 }}
                            onClick={() => navigate(AUTH_ROUTES.LOGIN)}
                        >
                            Back to Sign In
                        </Button>
                    </div>
                ) : (
                    <Form
                        form={form}
                        layout="vertical"
                        size="large"
                        initialValues={{
                            email: initialEmail,
                            token: initialToken,
                        }}
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email address' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Registered email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="token"
                            label="Reset Token"
                            rules={[{ required: true, message: 'Please enter the reset token' }]}
                        >
                            <Input
                                prefix={<KeyOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Paste reset token here"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="New Password"
                            rules={[
                                { required: true, message: 'Please enter a new password' },
                                { min: 6, message: 'Password must be at least 6 characters' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="New password (min 6 chars)"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password_confirmation"
                            label="Confirm Password"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm your new password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error('The confirmation password does not match.')
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                placeholder="Repeat new password"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                loading={loading}
                                style={{
                                    height: 44,
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                }}
                            >
                                Reset Password
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Link to={AUTH_ROUTES.LOGIN} style={{ color: '#64748b', fontSize: 14 }}>
                        Back to Sign In
                    </Link>
                </div>
            </Card>
        </div>
    );
}
