import React, { ReactNode } from 'react';
import { Breadcrumb, Flex, Typography } from 'antd';
import type { BreadcrumbProps } from 'antd';

const { Title, Text } = Typography;

export type BreadcrumbItem = NonNullable<BreadcrumbProps['items']>[number];

export interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    breadcrumbs?: BreadcrumbProps['items'];
    extra?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    breadcrumbs,
    extra,
    style,
    className,
}: PageHeaderProps) {
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
                <div>
                    {typeof title === 'string' ? (
                        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#172033' }}>
                            {title}
                        </Title>
                    ) : (
                        title
                    )}
                    {description && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 14 }}>
                            {description}
                        </Text>
                    )}
                </div>
                {extra && <Flex align="center" gap={12}>{extra}</Flex>}
            </Flex>
        </div>
    );
}