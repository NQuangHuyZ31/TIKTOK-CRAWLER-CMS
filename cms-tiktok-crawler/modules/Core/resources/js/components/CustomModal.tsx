import React, { ReactNode } from 'react';
import { Modal } from 'antd';

export interface CustomModalProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children?: ReactNode;
    handleOk?: () => void | Promise<any>;
    confirmLoading?: boolean;
    okText?: string;
    cancelText?: string;
    okType?: 'primary' | 'danger' | 'dashed' | 'link' | 'text';
    danger?: boolean;
    width?: number | string;
    footer?: ReactNode;
}

const CustomModal = ({
    open,
    onClose,
    title,
    children,
    handleOk,
    confirmLoading = false,
    okText = 'OK',
    cancelText = 'Cancel',
    okType = 'primary',
    danger = false,
    width = 520,
    footer,
}: CustomModalProps) => {
    if (!open) return null;

    return (
        <Modal
            title={title}
            open={open}
            onOk={handleOk}
            confirmLoading={confirmLoading}
            onCancel={onClose}
            okText={okText}
            cancelText={cancelText}
            okButtonProps={{ danger: danger || okType === 'danger' }}
            width={width}
            footer={footer}
            destroyOnClose
        >
            {children}
        </Modal>
    );
};

export default React.memo(CustomModal);
