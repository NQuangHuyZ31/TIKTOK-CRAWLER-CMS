import React from 'react';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

interface ArticlePaginationFooterProps {
	prevArticle?: {
		id: string;
		title: string;
	};
	nextArticle?: {
		id: string;
		title: string;
	};
	onSelectArticle: (articleId: string) => void;
}

export default function ArticlePaginationFooter({
	prevArticle,
	nextArticle,
	onSelectArticle,
}: ArticlePaginationFooterProps) {
	if (!prevArticle && !nextArticle) return null;

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				gap: 20,
				marginTop: 20,
				paddingTop: 24,
				borderTop: '1px solid #f0f0f0',
				flexWrap: 'wrap',
			}}
		>
			{/* Previous Article Card */}
			{prevArticle ? (
				<div
					onClick={() => onSelectArticle(prevArticle.id)}
					style={{
						flex: '1 1 280px',
						border: '1px solid #e8e8e8',
						borderRadius: 10,
						padding: '16px 20px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						backgroundColor: '#ffffff',
						transition: 'all 0.2s ease',
					}}
				>
					<ArrowLeftOutlined style={{ fontSize: 18, color: '#1677ff' }} />
					<div style={{ flex: 1, minWidth: 0 }}>
						<Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>
							Previous
						</Text>
						<Text strong ellipsis style={{ fontSize: 14, color: '#1677ff', display: 'block' }}>
							{prevArticle.title}
						</Text>
					</div>
				</div>
			) : (
				<div style={{ flex: '1 1 280px' }} />
			)}

			{/* Next Article Card */}
			{nextArticle ? (
				<div
					onClick={() => onSelectArticle(nextArticle.id)}
					style={{
						flex: '1 1 280px',
						border: '1px solid #e8e8e8',
						borderRadius: 10,
						padding: '16px 20px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 16,
						backgroundColor: '#ffffff',
						transition: 'all 0.2s ease',
						textAlign: 'right',
					}}
				>
					<div style={{ flex: 1, minWidth: 0 }}>
						<Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>
							Next
						</Text>
						<Text strong ellipsis style={{ fontSize: 14, color: '#1677ff', display: 'block' }}>
							{nextArticle.title}
						</Text>
					</div>
					<ArrowRightOutlined style={{ fontSize: 18, color: '#1677ff' }} />
				</div>
			) : (
				<div style={{ flex: '1 1 280px' }} />
			)}
		</div>
	);
}
