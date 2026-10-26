import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Upload, Button, Modal, Typography, message, type UploadProps, type UploadFile } from 'antd';
import { UploadOutlined, PlusOutlined, InboxOutlined, DeleteOutlined, EyeOutlined, LoadingOutlined, CameraOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export type UploadVariant = 'avatar' | 'dragger' | 'button' | 'picture-card';

export interface UploadComponentProps {
	/** Display variant: 'avatar' (single profile photo), 'dragger' (drag & drop), 'button' (simple button), 'picture-card' (grid of pictures) */
	variant?: UploadVariant;
	/** Value injected automatically by Ant Design Form.Item or passed manually (image URL, File, or UploadFile[]) */
	value?: string | File | UploadFile[] | null;
	/** Injected automatically by Ant Design Form.Item or passed manually to receive the changed value */
	onChange?: (value: any) => void;
	/** Optional callback passing raw File (or null if removed) and current fileList */
	onFileChange?: (file: File | null, fileList: UploadFile[]) => void;
	/** Initial or fallback preview URL */
	previewUrl?: string | null;
	/** Accepted file types, e.g. 'image/*', 'image/png,image/jpeg,image/webp', '.pdf,.doc' */
	accept?: string;
	/** Max file size in megabytes (MB). Default: 5MB */
	maxSizeMB?: number;
	/** Maximum number of files (default: 1 for avatar) */
	maxCount?: number;
	/** Enable multiple file selection */
	multiple?: boolean;
	/** Disable interactions */
	disabled?: boolean;
	/** Loading state */
	loading?: boolean;
	/** Custom beforeUpload validator callback */
	beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<boolean | void> | void;
	/** Callback when file is removed */
	onRemove?: (file: UploadFile) => boolean | void | Promise<boolean | void>;
	/** Backend upload action URL (optional) */
	action?: string;
	/** Custom upload request implementation */
	customRequest?: UploadProps['customRequest'];
	/** Title / button label */
	title?: string;
	/** Description / helper hint (e.g. 'JPG, PNG, WEBP up to 2MB') */
	hint?: string;
	/** Width for avatar variant (default: 104) */
	width?: number | string;
	/** Height for avatar variant (default: 104) */
	height?: number | string;
	/** Shape for avatar variant: 'square' (rounded corners) or 'circle' */
	shape?: 'square' | 'circle';
	/** Custom CSS class name */
	className?: string;
	/** Custom container style */
	style?: React.CSSProperties;
	/** Extra child nodes */
	children?: React.ReactNode;
}

/**
 * Convert value prop to a displayable preview URL string
 */
function resolvePreviewUrl(val: any, fallbackUrl?: string | null): string | null {
	if (!val && fallbackUrl) return fallbackUrl;
	if (typeof val === 'string' && val.trim().length > 0) return val;
	if (typeof window !== 'undefined' && val instanceof File) {
		return URL.createObjectURL(val);
	}
	if (Array.isArray(val) && val.length > 0) {
		const first = val[0];
		if (typeof first === 'string') return first;
		if (first?.url) return first.url;
		if (first?.thumbUrl) return first.thumbUrl;
		if (first?.originFileObj instanceof File) {
			return URL.createObjectURL(first.originFileObj);
		}
	}
	return fallbackUrl ?? null;
}

/**
 * Shared Upload Component for CMS TikTok Crawler.
 *
 * Key Capabilities:
 * 1. Zero-boilerplate: Works out of the box inside Ant Design <Form.Item name="field"> WITHOUT needing manual onChange or state management.
 * 2. Automatic Preview on Change: Automatically displays the selected image instantly using ObjectURL.
 * 3. 4 Display Modes: 'avatar' (profile image with hover overlay), 'dragger' (drag and drop), 'button' (simple button), and 'picture-card'.
 * 4. Built-in Validation: Automatic file size (maxSizeMB) and MIME validation with Ant Design alerts.
 * 5. Full Hover Actions: Preview zoom modal, Replace file, and Delete file.
 */
export default function UploadComponent({
	variant = 'button',
	value,
	onChange,
	onFileChange,
	previewUrl,
	accept,
	maxSizeMB = 5,
	maxCount,
	multiple = false,
	disabled = false,
	loading = false,
	beforeUpload,
	onRemove,
	action,
	customRequest,
	title,
	hint,
	width = 104,
	height = 104,
	shape = 'square',
	className,
	style,
	children,
}: UploadComponentProps) {
	const effectiveMaxCount = maxCount ?? (variant === 'avatar' ? 1 : undefined);
	const effectiveAccept = accept ?? (variant === 'avatar' ? 'image/*' : undefined);

	// Keep track of dynamically created object URLs to revoke them and avoid memory leaks
	const createdUrlsRef = useRef<Set<string>>(new Set());

	const safeCreateObjectURL = useCallback((file: File): string => {
		const url = URL.createObjectURL(file);
		createdUrlsRef.current.add(url);
		return url;
	}, []);

	// Internal preview state (can be initialized from value or previewUrl)
	const [internalPreview, setInternalPreview] = useState<string | null>(() => resolvePreviewUrl(value, previewUrl));

	// Synchronize preview when external value or previewUrl prop changes
	useEffect(() => {
		const resolved = resolvePreviewUrl(value, previewUrl);
		setInternalPreview(resolved);
	}, [value, previewUrl]);

	// Clean up created object URLs on unmount
	useEffect(() => {
		return () => {
			createdUrlsRef.current.forEach((url) => {
				try {
					URL.revokeObjectURL(url);
				} catch {
					// Ignore revoke errors on teardown
				}
			});
			createdUrlsRef.current.clear();
		};
	}, []);

	const [fileList, setFileList] = useState<UploadFile[]>(() => {
		if (Array.isArray(value)) return value;
		return [];
	});

	const [previewModalVisible, setPreviewModalVisible] = useState(false);
	const [previewImage, setPreviewImage] = useState<string>('');
	const [previewTitle, setPreviewTitle] = useState<string>('');
	const [isHovered, setIsHovered] = useState(false);

	/**
	 * Intercept file before upload: handles size/MIME validation,
	 * generates instant preview, and propagates value to Ant Design Form without needing manual onChange.
	 */
	const handleBeforeUpload = async (file: File, files: File[]) => {
		// 1. Validate file size
		const isLtSize = file.size / 1024 / 1024 <= maxSizeMB;
		if (!isLtSize) {
			message.error(`File size must be smaller than ${maxSizeMB}MB!`);
			return Upload.LIST_IGNORE;
		}

		// 2. Validate MIME type if image/*
		if (effectiveAccept?.includes('image/') && !file.type.startsWith('image/')) {
			message.error('Please upload a valid image file (JPG, PNG, WEBP)!');
			return Upload.LIST_IGNORE;
		}

		// 3. Custom validator if provided
		if (beforeUpload) {
			const customResult = await beforeUpload(file, files);
			if (customResult === false) {
				return false;
			}
		}

		// 4. Automatically generate instant preview
		if (variant === 'avatar' || file.type.startsWith('image/')) {
			const objectUrl = safeCreateObjectURL(file);
			setInternalPreview(objectUrl);
		}

		// 5. Update internal file list
		const newUploadFile: UploadFile = {
			uid: `upload-${Date.now()}-${Math.random()}`,
			name: file.name,
			size: file.size,
			type: file.type,
			originFileObj: file as any,
			status: 'done',
			thumbUrl: file.type.startsWith('image/') ? safeCreateObjectURL(file) : undefined,
		};

		const updatedList = effectiveMaxCount === 1 ? [newUploadFile] : [...fileList, newUploadFile];
		setFileList(updatedList);

		// 6. Seamless Form Integration: Propagate raw File to Form.Item (or parent onChange)
		if (onChange) {
			if (variant === 'avatar' || effectiveMaxCount === 1) {
				onChange(file);
			} else {
				onChange(updatedList);
			}
		}

		// 7. Call optional onFileChange callback
		if (onFileChange) {
			onFileChange(file, updatedList);
		}

		// Return false to prevent default uncontrolled POST if no backend action specified
		return action || customRequest ? true : false;
	};

	/**
	 * Handle removal of an uploaded file
	 */
	const handleRemove = (file: UploadFile) => {
		if (onRemove) {
			const result = onRemove(file);
			if (result === false) return false;
		}

		setInternalPreview(null);
		setFileList([]);

		// Notify form and parent of removal
		if (onChange) {
			onChange(null);
		}
		if (onFileChange) {
			onFileChange(null, []);
		}

		return true;
	};

	/**
	 * Handle Ant Design Upload onChange for dragger/button/picture-card
	 */
	const handleUploadChange: UploadProps['onChange'] = (info) => {
		setFileList(info.fileList);

		// If file was removed via file list
		if (info.file.status === 'removed') {
			if (onChange) onChange(null);
			if (onFileChange) onFileChange(null, info.fileList);
		}
	};

	/**
	 * Handle preview click (picture-card or avatar zoom)
	 */
	const handlePreview = async (file: UploadFile) => {
		let src = file.url || file.preview || file.thumbUrl;
		if (!src && file.originFileObj) {
			src = safeCreateObjectURL(file.originFileObj as Blob as File);
		}
		setPreviewImage(src || '');
		setPreviewModalVisible(true);
		setPreviewTitle(file.name || 'Image Preview');
	};

	const borderRadius = shape === 'circle' ? '50%' : '8px';

	// ----------------------------------------------------
	// Variant 1: Avatar Mode (Single photo with hover overlay)
	// ----------------------------------------------------
	if (variant === 'avatar') {
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
						transition: 'all 0.25s ease',
						cursor: disabled ? 'not-allowed' : 'pointer',
						boxShadow: isHovered && !disabled ? '0 4px 12px rgba(22, 119, 255, 0.12)' : 'none',
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					{internalPreview ? (
						<>
							<img
								src={internalPreview}
								alt="Avatar preview"
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									borderRadius,
								}}
							/>

							{/* Hover Overlay with Action Buttons */}
							{!disabled && (
								<div
									style={{
										position: 'absolute',
										inset: 0,
										backgroundColor: 'rgba(0, 0, 0, 0.58)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 14,
										opacity: isHovered || loading ? 1 : 0,
										transition: 'opacity 0.2s ease',
										borderRadius,
									}}
								>
									{loading ? (
										<LoadingOutlined style={{ color: '#fff', fontSize: 20 }} />
									) : (
										<>
											<EyeOutlined
												style={{ color: '#ffffff', fontSize: 18 }}
												onClick={(e) => {
													e.stopPropagation();
													setPreviewImage(internalPreview);
													setPreviewTitle('Avatar Preview');
													setPreviewModalVisible(true);
												}}
												title="View Full Preview"
											/>
											<Upload accept={effectiveAccept} showUploadList={false} beforeUpload={handleBeforeUpload} disabled={disabled}>
												<CameraOutlined style={{ color: '#ffffff', fontSize: 18 }} title="Change Photo" />
											</Upload>
											<DeleteOutlined
												style={{ color: '#ff7875', fontSize: 18 }}
												onClick={(e) => {
													e.stopPropagation();
													handleRemove({ uid: '-1', name: 'avatar' });
												}}
												title="Remove Photo"
											/>
										</>
									)}
								</div>
							)}
						</>
					) : (
						<Upload accept={effectiveAccept} showUploadList={false} beforeUpload={handleBeforeUpload} disabled={disabled} style={{ width: '100%', height: '100%' }}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									padding: 8,
									color: '#8c8c8c',
									height: '100%',
								}}
							>
								{loading ? (
									<LoadingOutlined style={{ fontSize: 24, color: '#1677ff' }} />
								) : (
									<>
										<PlusOutlined style={{ fontSize: 22, color: '#1677ff', marginBottom: 6 }} />
										<Text style={{ fontSize: 12, color: '#595959', fontWeight: 500 }}>{title || 'Upload'}</Text>
									</>
								)}
							</div>
						</Upload>
					)}
				</div>

				{hint && (
					<Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
						{hint}
					</Text>
				)}

				{/* Built-in Enlarged Preview Modal */}
				<Modal open={previewModalVisible} title={previewTitle} footer={null} onCancel={() => setPreviewModalVisible(false)} centered>
					<img alt="Preview" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} src={previewImage} />
				</Modal>
			</div>
		);
	}

	// ----------------------------------------------------
	// Variant 2: Dragger Mode (Drag & drop zone)
	// ----------------------------------------------------
	if (variant === 'dragger') {
		return (
			<div className={className} style={style}>
				<Upload.Dragger
					accept={effectiveAccept}
					maxCount={effectiveMaxCount}
					multiple={multiple}
					disabled={disabled}
					fileList={fileList}
					beforeUpload={handleBeforeUpload}
					onChange={handleUploadChange}
					onRemove={handleRemove}
					action={action}
					customRequest={customRequest}
					style={{ borderRadius: 8, padding: '24px 0' }}
				>
					<p className="ant-upload-drag-icon" style={{ marginBottom: 12 }}>
						{loading ? <LoadingOutlined style={{ fontSize: 36, color: '#1677ff' }} /> : <InboxOutlined style={{ fontSize: 42, color: '#1677ff' }} />}
					</p>
					<Paragraph strong style={{ fontSize: 15, marginBottom: 4 }}>
						{title || 'Click or drag file to this area to upload'}
					</Paragraph>
					<Text type="secondary" style={{ fontSize: 13 }}>
						{hint || `Supports files up to ${maxSizeMB}MB`}
					</Text>
					{children}
				</Upload.Dragger>
			</div>
		);
	}

	// ----------------------------------------------------
	// Variant 3: Picture Card Mode (Multiple thumbnails)
	// ----------------------------------------------------
	if (variant === 'picture-card') {
		const uploadButton = (
			<div>
				{loading ? <LoadingOutlined /> : <PlusOutlined />}
				<div style={{ marginTop: 8 }}>{title || 'Upload'}</div>
			</div>
		);

		return (
			<div className={className} style={style}>
				<Upload
					accept={effectiveAccept}
					listType="picture-card"
					maxCount={effectiveMaxCount}
					multiple={multiple}
					disabled={disabled}
					fileList={fileList}
					onPreview={handlePreview}
					beforeUpload={handleBeforeUpload}
					onChange={handleUploadChange}
					onRemove={handleRemove}
					action={action}
					customRequest={customRequest}
				>
					{effectiveMaxCount && fileList.length >= effectiveMaxCount ? null : uploadButton}
				</Upload>

				{hint && (
					<Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
						{hint}
					</Text>
				)}

				<Modal open={previewModalVisible} title={previewTitle} footer={null} onCancel={() => setPreviewModalVisible(false)} centered>
					<img alt="Preview" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} src={previewImage} />
				</Modal>
			</div>
		);
	}

	// ----------------------------------------------------
	// Variant 4: Button Mode (Default)
	// ----------------------------------------------------
	return (
		<div className={className} style={style}>
			<Upload
				accept={effectiveAccept}
				maxCount={effectiveMaxCount}
				multiple={multiple}
				disabled={disabled}
				fileList={fileList}
				beforeUpload={handleBeforeUpload}
				onChange={handleUploadChange}
				onRemove={handleRemove}
				action={action}
				customRequest={customRequest}
			>
				{children || (
					<Button icon={loading ? <LoadingOutlined /> : <UploadOutlined />} disabled={disabled}>
						{title || 'Select File to Upload'}
					</Button>
				)}
			</Upload>
			{hint && (
				<Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
					{hint}
				</Text>
			)}
		</div>
	);
}
