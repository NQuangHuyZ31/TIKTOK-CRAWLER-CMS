import React, { ReactNode } from 'react';
import { Breadcrumb, Button, Flex, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { BreadcrumbProps } from 'antd';

const { Title, Text } = Typography;

export type BreadcrumbItem = NonNullable<BreadcrumbProps['items']>[number];

export interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    description?: ReactNode;
    onBack?: () => void;
    breadcrumbs?: BreadcrumbProps['items'];
    extra?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    description,
    onBack,
    breadcrumbs,
    extra,
    style,
    className,
}: PageHeaderProps) {
    const subText = subtitle ?? description;

    return (
        <div
            className={className}
            style={{
                marginBottom: 24,
                ...style,
            }}
        >
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb
                    items={breadcrumbs}
                    style={{ marginBottom: 12, fontSize: 13 }}
                />
            )}
            <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                <Flex align="center" gap={12}>
                    {onBack && (
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={onBack}
                            style={{ borderRadius: 8 }}
                        />
                    )}
                    <div>
                        {typeof title === 'string' ? (
                            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#172033' }}>
                                {title}
                            </Title>
                        ) : (
                            title
                        )}
                        {subText && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 14 }}>
                                {subText}
                            </Text>
                        )}
                    </div>
                </Flex>
                {extra && <Flex align="center" gap={12}>{extra}</Flex>}
            </Flex>
        </div>
    );
}