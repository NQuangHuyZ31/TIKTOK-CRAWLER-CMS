import React, { ReactNode } from 'react';
import { Modal, Space, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface ConfirmDialogProps {
	open: boolean;
	title: string;
	content: ReactNode;
	onConfirm: () => void | Promise<any>;
	onCancel: () => void;
	confirmLoading?: boolean;
	okText?: string;
	cancelText?: string;
	danger?: boolean;
}

export default function ConfirmDialog({ open, title, content, onConfirm, onCancel, confirmLoading = false, okText = 'Confirm', cancelText = 'Cancel', danger = true }: ConfirmDialogProps) {
	return (
		<Modal open={open} onOk={onConfirm} onCancel={onCancel} confirmLoading={confirmLoading} okText={okText} cancelText={cancelText} okButtonProps={{ danger }} centered width={440}>
			<Space align="start" size={16} style={{ padding: '8px 0' }}>
				<ExclamationCircleOutlined
					style={{
						fontSize: 28,
						color: danger ? '#ff4d4f' : '#faad14',
						marginTop: 2,
					}}
				/>
				<div>
					<Title level={5} style={{ margin: 0, marginBottom: 8 }}>
						{title}
					</Title>
					{typeof content === 'string' ? <Text type="secondary">{content}</Text> : content}
				</div>
			</Space>
		</Modal>
	);
}
