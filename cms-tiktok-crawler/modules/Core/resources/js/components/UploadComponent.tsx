import React, { useMemo } from 'react';
import { Upload, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface UploadComponentProps {
	/** Value passed by Form.Item or state: image URL string, raw File, or null */
	value?: string | File | null;
	/** Callback invoked with raw File or null when cleared */
	onChange?: (file: File | null) => void;
	/** Accepted file extensions or MIME types (default: 'image/*') */
	accept?: string;
	/** Max file size in megabytes (default: 2) */
	maxSizeMB?: number;
	/** Shape: 'square' (rounded 8px) or 'circle' (default: 'square') */
	shape?: 'square' | 'circle';
	/** Width in px (default: 100) */
	width?: number | string;
	/** Height in px (default: 100) */
	height?: number | string;
	/** Disable interactions */
	disabled?: boolean;
	/** Loading state */
	loading?: boolean;
	/** Helper hint beneath upload area */
	hint?: string;
	/** Backward compatibility variant prop (default: 'avatar') */
	variant?: string;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * Lightweight, streamlined Upload Component for image/avatar inputs.
 * Zero-boilerplate: Works directly inside Ant Design <Form.Item name="field">.
 */
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
	// Resolve preview URL from string or File object
	const previewUrl = useMemo(() => {
		if (!value) return null;
		if (typeof value === 'string' && value.trim()) return value;
		if (typeof window !== 'undefined' && value instanceof File) {
			return URL.createObjectURL(value);
		}
		return null;
	}, [value]);

	const handleBeforeUpload = (file: File) => {
		const isLt = file.size / 1024 / 1024 <= maxSizeMB;
		if (!isLt) {
			message.error(`Image size must be smaller than ${maxSizeMB}MB!`);
			return Upload.LIST_IGNORE;
		}

		if (accept.includes('image/') && !file.type.startsWith('image/')) {
			message.error('Please select a valid image file!');
			return Upload.LIST_IGNORE;
		}

		onChange?.(file);
		return false; // Prevent automatic HTTP POST
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange?.(null);
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
					<>
						<img
							src={previewUrl}
							alt="Preview"
							style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }}
						/>
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
								<Upload
									accept={accept}
									showUploadList={false}
									beforeUpload={handleBeforeUpload}
									disabled={disabled}
								>
									<span style={{ color: '#fff', fontSize: 13, marginRight: 10, cursor: 'pointer' }}>Change</span>
								</Upload>
								<DeleteOutlined
									style={{ color: '#ff7875', fontSize: 16, cursor: 'pointer' }}
									onClick={handleRemove}
									title="Remove"
								/>
							</div>
						)}
					</>
				) : (
					<Upload
						accept={accept}
						showUploadList={false}
						beforeUpload={handleBeforeUpload}
						disabled={disabled}
						style={{ width: '100%', height: '100%' }}
					>
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
								<LoadingOutlined style={{ fontSize: 20, color: '#1677ff' }} />
							) : (
								<>
									<PlusOutlined style={{ fontSize: 18, color: '#1677ff', marginBottom: 4 }} />
									<Text style={{ fontSize: 12, color: '#595959' }}>Upload</Text>
								</>
							)}
						</div>
					</Upload>
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
