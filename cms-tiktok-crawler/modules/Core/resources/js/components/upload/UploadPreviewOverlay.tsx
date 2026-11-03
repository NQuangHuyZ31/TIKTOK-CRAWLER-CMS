import React from 'react';
import { Upload } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

export interface UploadPreviewOverlayProps {
	previewUrl: string;
	borderRadius: string;
	disabled?: boolean;
	accept?: string;
	onBeforeUpload: (file: File) => boolean | string;
	onRemove: (e: React.MouseEvent) => void;
}

export default function UploadPreviewOverlay({
	previewUrl,
	borderRadius,
	disabled = false,
	accept = 'image/*',
	onBeforeUpload,
	onRemove,
}: UploadPreviewOverlayProps) {
	return (
		<>
			<img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
			{!disabled && (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.45)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						opacity: 0,
						transition: 'opacity 0.2s ease',
						borderRadius,
					}}
					onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
					onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
				>
					<Upload accept={accept} showUploadList={false} beforeUpload={onBeforeUpload} disabled={disabled}>
						<span style={{ color: '#fff', fontSize: 13, marginRight: 10, cursor: 'pointer' }}>Change</span>
					</Upload>
					<DeleteOutlined style={{ color: '#ff7875', fontSize: 16, cursor: 'pointer' }} onClick={onRemove} title="Remove" />
				</div>
			)}
		</>
	);
}
