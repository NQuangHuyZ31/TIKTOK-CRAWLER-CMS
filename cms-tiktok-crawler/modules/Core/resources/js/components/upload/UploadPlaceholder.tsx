import React from 'react';
import { Upload, Typography } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface UploadPlaceholderProps {
	accept?: string;
	loading?: boolean;
	disabled?: boolean;
	onBeforeUpload: (file: File) => boolean | string;
}

export default function UploadPlaceholder({
	accept = 'image/*',
	loading = false,
	disabled = false,
	onBeforeUpload,
}: UploadPlaceholderProps) {
	return (
		<Upload accept={accept} showUploadList={false} beforeUpload={onBeforeUpload} disabled={disabled} style={{ width: '100%', height: '100%' }}>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#8c8c8c',
					height: '100%',
					padding: 8,
				}}
			>
				{loading ? (
					<LoadingOutlined style={{ fontSize: 20, color: '#EC008C' }} />
				) : (
					<>
						<PlusOutlined style={{ fontSize: 18, color: '#EC008C', marginBottom: 4 }} />
						<Text style={{ fontSize: 12, color: '#595959' }}>Upload</Text>
					</>
				)}
			</div>
		</Upload>
	);
}
