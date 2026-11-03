import React, { ReactNode } from 'react';
import { Button, Flex, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

export interface ResourceFormActionsProps {
	showCancel?: boolean;
	cancelText?: ReactNode;
	submitting?: boolean;
	loading?: boolean;
	resolvedSubmitText?: ReactNode;
	extraActions?: ReactNode;
	onBack?: () => void;
}

export default function ResourceFormActions({
	showCancel = true,
	cancelText = 'Cancel',
	submitting = false,
	loading = false,
	resolvedSubmitText = 'Save Changes',
	extraActions,
	onBack,
}: ResourceFormActionsProps) {
	return (
		<Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginTop: 24 }}>
			<Space wrap size="middle">
				{showCancel && (
					<Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={submitting}>
						{cancelText}
					</Button>
				)}
				{extraActions}
			</Space>
			<Space wrap size="middle">
				<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} disabled={loading}>
					{resolvedSubmitText}
				</Button>
			</Space>
		</Flex>
	);
}
