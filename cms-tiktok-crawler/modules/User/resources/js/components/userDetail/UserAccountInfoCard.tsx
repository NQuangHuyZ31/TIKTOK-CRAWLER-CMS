import React from 'react';
import { Card, Descriptions, Tag, theme } from 'antd';
import StatusTag from '@core/components/StatusTag';
import { formatDateTime } from '@core/utils/formatDate';
import type { UserItem } from '../../Action/user';

export interface UserAccountInfoCardProps {
    user: UserItem;
}

export default function UserAccountInfoCard({ user }: UserAccountInfoCardProps) {
    const { token } = theme.useToken();

    return (
        <Card
            title="Account Information"
            bordered={false}
            style={{
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                height: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
        >
            <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="User ID">
                    <span style={{ fontWeight: 600, color: token.colorPrimary }}>#{user.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
                <Descriptions.Item label="Email Address">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Phone Number">{user.phone || '—'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                    <StatusTag status={user.status} />
                </Descriptions.Item>
                <Descriptions.Item label="Email Verified">
                    {user.email_verified_at ? (
                        <Tag color="success">Verified ({formatDateTime(user.email_verified_at)})</Tag>
                    ) : (
                        <Tag color="default">Unverified</Tag>
                    )}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">{formatDateTime(user.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Last Updated">{formatDateTime(user.updated_at)}</Descriptions.Item>
            </Descriptions>
        </Card>
    );
}
