import React from 'react';
import { Breadcrumb, Tag, Typography, theme } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { DocArticle } from '../../types/docSchema';
import DocBlockRenderer from './DocBlockRenderer';
import FeedbackWidget from './FeedbackWidget';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Paragraph, Text, Title } = Typography;

interface DocArticleRendererProps {
	article: DocArticle;
}

export default function DocArticleRenderer({ article }: DocArticleRendererProps) {
	const { token } = theme.useToken();
	const { language, t } = useDocLanguage();

	return (
		<div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 0 60px' }}>
			{/* Breadcrumbs */}
			<div style={{ marginBottom: 16 }}>
				<Breadcrumb
					items={article.breadcrumbs.map((b) => ({
						title: b.url ? <Link to={b.url}>{b.label}</Link> : b.label,
					}))}
				/>
			</div>

			{/* Article Header */}
			<div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
					<Tag color={article.pillar === 'learn' ? 'blue' : 'green'} style={{ textTransform: 'uppercase', fontSize: 11 }}>
						{article.pillar === 'learn'
							? t('article.pillar.learn', 'Learn · Knowledge', 'Tìm hiểu · Kiến thức')
							: t('article.pillar.follow', 'Follow · Guide', 'Thực hành · Hướng dẫn')}
					</Tag>
					{article.duration && (
						<Text type="secondary" style={{ fontSize: 12 }}>
							{article.duration}
						</Text>
					)}
				</div>

				<Title level={1} style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: token.colorText }}>
					{article.title}
				</Title>

				{article.subtitle && (
					<Paragraph type="secondary" style={{ fontSize: 14, margin: 0, lineHeight: 1.6 }}>
						{article.subtitle}
					</Paragraph>
				)}
			</div>

			{/* Block-based Content Body */}
			<DocBlockRenderer blocks={article.blocks} />

			{/* Feedback */}
			<FeedbackWidget />

			{/* Previous & Next Article Footer Navigation Cards */}
			{(article.prevArticle || article.nextArticle) && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: 16,
						marginTop: 24,
						paddingTop: 24,
						borderTop: `1px solid ${token.colorBorderSecondary}`,
						flexWrap: 'wrap',
					}}
				>
					{article.prevArticle ? (
						<Link
							to={`/guideline/${article.prevArticle.pillar}/${article.prevArticle.slug}`}
							style={{
								flex: '1 1 240px',
								border: `1px solid ${token.colorBorderSecondary}`,
								borderRadius: 8,
								padding: '14px 18px',
								display: 'flex',
								alignItems: 'center',
								gap: 12,
								backgroundColor: token.colorBgContainer,
								textDecoration: 'none',
							}}
						>
							<ArrowLeftOutlined style={{ fontSize: 14, color: token.colorPrimary }} />
							<div style={{ minWidth: 0 }}>
								<Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>
									{t('article.prev', 'Previous', 'Bài trước')}
								</Text>
								<Text strong ellipsis style={{ fontSize: 13, color: token.colorPrimary, display: 'block' }}>
									{article.prevArticle.title}
								</Text>
							</div>
						</Link>
					) : (
						<div style={{ flex: '1 1 240px' }} />
					)}

					{article.nextArticle ? (
						<Link
							to={`/guideline/${article.nextArticle.pillar}/${article.nextArticle.slug}`}
							style={{
								flex: '1 1 240px',
								border: `1px solid ${token.colorBorderSecondary}`,
								borderRadius: 8,
								padding: '14px 18px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
								backgroundColor: token.colorBgContainer,
								textDecoration: 'none',
								textAlign: 'right',
							}}
						>
							<div style={{ minWidth: 0, flex: 1 }}>
								<Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>
									{t('article.next', 'Next', 'Bài tiếp')}
								</Text>
								<Text strong ellipsis style={{ fontSize: 13, color: token.colorPrimary, display: 'block' }}>
									{article.nextArticle.title}
								</Text>
							</div>
							<ArrowRightOutlined style={{ fontSize: 14, color: token.colorPrimary }} />
						</Link>
					) : (
						<div style={{ flex: '1 1 240px' }} />
					)}
				</div>
			)}
		</div>
	);
}
