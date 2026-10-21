import React, { ReactNode } from 'react';
import { Empty, Button, Flex } from 'antd';

export interface EmptyStateProps {
    description?: ReactNode;
    actionText?: string;
    onAction?: () => void;
    image?: ReactNode;
    style?: React.CSSProperties;
}

export default function EmptyState({
    description = 'No data available',
    actionText,
    onAction,
    image = Empty.PRESENTED_IMAGE_SIMPLE,
    style,
}: EmptyStateProps) {
    return (
        <Flex justify="center" align="center" style={{ padding: '40px 0', ...style }}>
            <Empty image={image} description={description}>
                {actionText && onAction && (
                    <Button type="primary" onClick={onAction}>
                        {actionText}
                    </Button>
                )}
            </Empty>
        </Flex>
    );
}
