import React, { useState } from 'react';
import { Button, type ButtonProps } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExportModal from './ExportModal';

export interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
	endpoint: string;
	currentParams?: Record<string, any>;
	buttonText?: string;
	modalTitle?: string;
	dateFieldLabel?: string;
	dateFieldKey?: string;
	filenamePrefix?: string;
}

export default function ExportButton({
	endpoint,
	currentParams = {},
	buttonText = 'Export CSV',
	modalTitle,
	dateFieldLabel,
	dateFieldKey,
	filenamePrefix,
	icon = <DownloadOutlined />,
	...buttonProps
}: ExportButtonProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button icon={icon} onClick={() => setOpen(true)} {...buttonProps}>
				{buttonText}
			</Button>
			<ExportModal
				open={open}
				onClose={() => setOpen(false)}
				endpoint={endpoint}
				currentParams={currentParams}
				title={modalTitle || 'Export Data'}
				dateFieldLabel={dateFieldLabel}
				dateFieldKey={dateFieldKey}
				filenamePrefix={filenamePrefix}
			/>
		</>
	);
}
