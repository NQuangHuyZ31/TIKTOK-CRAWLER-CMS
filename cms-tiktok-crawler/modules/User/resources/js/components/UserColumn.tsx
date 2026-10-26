import React from 'react';
import { Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Text } = Typography;

interface UserColumnProps {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
}

export default function UserColumn({ id, name, email, avatarUrl }: UserColumnProps) {
    const getInitials = (str: string) => {
        const parts = str.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return (str.slice(0, 2) || 'U').toUpperCase();
    };

    return (
        <Space size={12} align="center">
            {avatarUrl ? (
                <Avatar src={avatarUrl} size={38} />
            ) : (
                <Avatar
                    size={38}
                    style={{
                        backgroundColor: '#1677ff',
                        fontWeight: 600,
                        fontSize: 14,
                    }}
                >
                    {getInitials(name)}
                </Avatar>
            )}
            <div>
                <div>
                    <Link
                        to={`/user/${id}`}
                        style={{
                            fontWeight: 600,
                            color: '#1f2937',
                            fontSize: 14,
                        }}
                    >
                        {name}
                    </Link>
                </div>
                <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {email}
                    </Text>
                </div>
            </div>
        </Space>
    );
}
