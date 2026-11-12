import React from 'react';
import { Row, Col, Card, Typography, Space, theme } from 'antd';
import {
    TeamOutlined,
    CheckCircleOutlined,
    StopOutlined,
    CrownOutlined,
} from '@ant-design/icons';
import { useTheme } from '@core/contexts/ThemeContext';
import type { UserStatistics } from '../Action/user';

const { Text, Title } = Typography;

interface UserKpiCardsProps {
    statistics: UserStatistics;
    loading?: boolean;
}

export default function UserKpiCards({ statistics, loading = false }: UserKpiCardsProps) {
    const { token } = theme.useToken();
    const { isDark } = useTheme();
    const total = statistics.total_users || 0;
    const active = statistics.active_users || 0;
    const inactive = (statistics.inactive_users || 0) + (statistics.blocked_users || 0);
    const privileged = (statistics.admin_users || 0) + (statistics.manager_users || 0);

    const activeRate = total > 0 ? Math.round((active / total) * 100) : 100;

    const cards = [
        {
            title: 'Total Users',
            value: total,
            icon: <TeamOutlined style={{ fontSize: 22, color: '#EC008C' }} />,
            bg: '#fff0f7',
            badge: `${total} registered`,
            badgeColor: '#EC008C',
            subtext: 'Across all system roles',
        },
        {
            title: 'Active Users',
            value: active,
            icon: <CheckCircleOutlined style={{ fontSize: 22, color: '#52c41a' }} />,
            bg: '#f6ffed',
            badge: `${activeRate}% active rate`,
            badgeColor: '#52c41a',
            subtext: `${statistics.inactive_users || 0} inactive accounts`,
        },
        {
            title: 'Inactive / Blocked',
            value: inactive,
            icon: <StopOutlined style={{ fontSize: 22, color: '#ff4d4f' }} />,
            bg: '#fff1f0',
            badge: `${statistics.blocked_users || 0} blocked`,
            badgeColor: '#ff4d4f',
            subtext: 'Suspended or disabled access',
        },
        {
            title: 'Admins & Managers',
            value: privileged,
            icon: <CrownOutlined style={{ fontSize: 22, color: '#722ed1' }} />,
            bg: '#f9f0ff',
            badge: `${statistics.admin_users || 0} Super Admins`,
            badgeColor: '#722ed1',
            subtext: `${statistics.manager_users || 0} operations managers`,
        },
    ];

    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {cards.map((c, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                    <Card
                        loading={loading}
                        bordered={false}
                        style={{
                            borderRadius: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            border: `1px solid ${token.colorBorderSecondary}`,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <Space orientation="horizontal" align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                                {c.title}
                            </Text>
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: isDark ? `${c.badgeColor}20` : c.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {c.icon}
                            </div>
                        </Space>
                        <Title level={2} style={{ margin: '4px 0 8px', fontWeight: 700, fontSize: 28 }}>
                            {c.value.toLocaleString()}
                        </Title>
                        <Space orientation="horizontal" size={6} align="center">
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: c.badgeColor,
                                    background: isDark ? `${c.badgeColor}20` : c.bg,
                                }}
                            >
                                {c.badge}
                            </span>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {c.subtext}
                            </Text>
                        </Space>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
