import React, { useMemo } from 'react';
import { Typography, message, Upload } from 'antd';
import UploadPreviewOverlay from './upload/UploadPreviewOverlay';
import UploadPlaceholder from './upload/UploadPlaceholder';

const { Text } = Typography;

export interface UploadComponentProps {
	value?: string | File | null;
	onChange?: (file: File | null) => void;
	accept?: string;
	maxSizeMB?: number;
	shape?: 'square' | 'circle';
	width?: number | string;
	height?: number | string;
	disabled?: boolean;
	loading?: boolean;
	hint?: string;
	variant?: string;
	className?: string;
	style?: React.CSSProperties;
}

export default function UploadComponent({
	value,
	onChange,
	accept = 'image/*',
	maxSizeMB = 2,
	shape = 'square',
	width = 100,
	height = 100,
	disabled = false,
	loading = false,
	hint,
	className,
	style,
}: UploadComponentProps) {
	const previewUrl = useMemo(() => {
		if (!value) return null;
		if (typeof value === 'string' && value.trim()) return value;
		if (typeof window !== 'undefined' && value instanceof File) {
			return URL.createObjectURL(value);
		}
		return null;
	}, [value]);

	const handleBeforeUpload = (file: File) => {
		if (file.size / 1024 / 1024 > maxSizeMB) {
			message.error(`Image size must be smaller than ${maxSizeMB}MB!`);
			return Upload.LIST_IGNORE;
		}

		if (accept.includes('image/') && !file.type.startsWith('image/')) {
			message.error('Please select a valid image file!');
			return Upload.LIST_IGNORE;
		}

		onChange?.(file);
		return false;
	};

	const borderRadius = shape === 'circle' ? '50%' : '8px';

	return (
		<div className={className} style={{ display: 'inline-block', ...style }}>
			<div
				style={{
					position: 'relative',
					width,
					height,
					borderRadius,
					overflow: 'hidden',
					border: '1px dashed #d9d9d9',
					backgroundColor: '#fafafa',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					cursor: disabled ? 'not-allowed' : 'pointer',
				}}
			>
				{previewUrl ? (
					<UploadPreviewOverlay
						previewUrl={previewUrl}
						borderRadius={borderRadius}
						disabled={disabled}
						accept={accept}
						onBeforeUpload={handleBeforeUpload}
						onRemove={(e) => {
							e.stopPropagation();
							onChange?.(null);
						}}
					/>
				) : (
					<UploadPlaceholder
						accept={accept}
						loading={loading}
						disabled={disabled}
						onBeforeUpload={handleBeforeUpload}
					/>
				)}
			</div>

			{hint && (
				<Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
					{hint}
				</Text>
			)}
		</div>
	);
}
