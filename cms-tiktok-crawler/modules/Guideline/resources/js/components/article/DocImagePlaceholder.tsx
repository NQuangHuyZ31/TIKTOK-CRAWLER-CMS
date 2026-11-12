import React from 'react';
import { Image, Tag, Typography, theme } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import type { DocScreenshot } from '../../types/docSchema';

const { Text } = Typography;

interface DocImagePlaceholderProps {
	screenshot: DocScreenshot;
}

export default function DocImagePlaceholder({ screenshot }: DocImagePlaceholderProps) {
	const { token } = theme.useToken();

	if (screenshot.src) {
		return (
			<div style={{ margin: '18px 0 24px', textAlign: 'center' }}>
				<Image
					src={screenshot.src}
					alt={screenshot.alt}
					style={{
						maxWidth: '100%',
						borderRadius: 8,
						border: '1px solid #e8e8e8',
						boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
					}}
				/>
				{screenshot.caption && (
					<Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12, fontStyle: 'italic' }}>
						{screenshot.caption}
					</Text>
				)}
			</div>
		);
	}

	return (
		<div
			style={{
				margin: '18px 0 24px',
				padding: '16px 20px',
				backgroundColor: token.colorFillAlter,
				border: `1px dashed ${token.colorBorder}`,
				borderRadius: 8,
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<CameraOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
					<Text strong style={{ fontSize: 13, color: token.colorText }}>
						SCREENSHOT PLACEHOLDER
					</Text>
				</div>
				<Tag color="blue" style={{ fontSize: 11 }}>
					{screenshot.location}
				</Tag>
			</div>

			<div style={{ fontSize: 12, lineHeight: 1.6, color: '#595959' }}>
				<div>
					<strong>Target Area:</strong> {screenshot.targetArea}
				</div>
				<div style={{ marginTop: 4 }}>
					<strong>Capture Instruction:</strong> {screenshot.captureInstruction}
				</div>
			</div>

			{screenshot.caption && (
				<div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
					<Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
						📷 {screenshot.caption}
					</Text>
				</div>
			)}
		</div>
	);
}
