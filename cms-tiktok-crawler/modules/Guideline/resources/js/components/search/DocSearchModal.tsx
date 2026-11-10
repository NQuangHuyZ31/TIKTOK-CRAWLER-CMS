import React, { useEffect, useState } from 'react';
import { Empty, Input, Modal, Tag, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { searchDocumentation } from '../../navigation/docTree';
import type { DocArticle } from '../../types/docSchema';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Text } = Typography;

interface DocSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function DocSearchModal({ isOpen, onClose }: DocSearchModalProps) {
	const [query, setQuery] = useState('');
	const navigate = useNavigate();
	const { language, t } = useDocLanguage();

	// Listen for Ctrl+K or Cmd+K
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (!isOpen) {
					// Open search modal
				}
			}
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	const { learnResults, followResults } = searchDocumentation(query, language);
	const hasResults = learnResults.length > 0 || followResults.length > 0;

	const handleSelect = (article: DocArticle) => {
		onClose();
		setQuery('');
		navigate(`/guideline/${article.pillar}/${article.slug}`);
	};

	return (
		<Modal
			open={isOpen}
			onCancel={onClose}
			footer={null}
			width={620}
			closable={false}
			bodyStyle={{ padding: 16 }}
			style={{ top: 80 }}
		>
			<Input
				placeholder={t(
					'search.placeholder',
					'Search documentation by title, topic, or content...',
					'Tìm kiếm tài liệu theo tiêu đề, chủ đề hoặc nội dung...'
				)}
				prefix={<SearchOutlined style={{ color: '#1677ff' }} />}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				size="large"
				allowClear
				autoFocus
				style={{ borderRadius: 8, marginBottom: 16 }}
			/>

			<div style={{ maxHeight: 420, overflowY: 'auto' }}>
				{!query.trim() && (
					<div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c', fontSize: 13 }}>
						{t(
							'search.hint',
							'Type keywords (e.g. "crawl modes", "secuid", "worker timeout", "retry")...',
							'Nhập từ khóa (ví dụ: "chế độ crawl", "secuid", "worker timeout", "retry")...'
						)}
					</div>
				)}

				{query.trim() && !hasResults && (
					<Empty
						description={
							language === 'vi'
								? `Không tìm thấy tài liệu phù hợp với "${query}"`
								: `No documentation found for "${query}"`
						}
						style={{ padding: '24px 0' }}
					/>
				)}

				{learnResults.length > 0 && (
					<div style={{ marginBottom: 14 }}>
						<div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#8c8c8c', letterSpacing: 0.5 }}>
							<BookOutlined style={{ color: '#1677ff', marginRight: 6 }} />
							{t('search.section.learn', 'LEARN (KNOWLEDGE & ARCHITECTURE)', 'TÌM HIỂU (KIẾN THỨC & KIẾN TRÚC)')}
						</div>
						{learnResults.map((art) => (
							<div
								key={art.id}
								onClick={() => handleSelect(art)}
								style={{
									padding: '8px 12px',
									borderRadius: 6,
									cursor: 'pointer',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									backgroundColor: '#fafafa',
									marginBottom: 4,
								}}
							>
								<div>
									<Text strong style={{ fontSize: 13, color: '#141414' }}>
										{art.title}
									</Text>
									<Text type="secondary" ellipsis style={{ fontSize: 11, display: 'block' }}>
										{art.subtitle}
									</Text>
								</div>
								<Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
									{art.category}
								</Tag>
							</div>
						))}
					</div>
				)}

				{followResults.length > 0 && (
					<div>
						<div style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#8c8c8c', letterSpacing: 0.5 }}>
							<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
							{t('search.section.follow', 'FOLLOW (GUIDES & SOPS)', 'THỰC HÀNH (HƯỚNG DẪN & THAO TÁC)')}
						</div>
						{followResults.map((art) => (
							<div
								key={art.id}
								onClick={() => handleSelect(art)}
								style={{
									padding: '8px 12px',
									borderRadius: 6,
									cursor: 'pointer',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									backgroundColor: '#fafafa',
									marginBottom: 4,
								}}
							>
								<div>
									<Text strong style={{ fontSize: 13, color: '#141414' }}>
										{art.title}
									</Text>
									<Text type="secondary" ellipsis style={{ fontSize: 11, display: 'block' }}>
										{art.subtitle}
									</Text>
								</div>
								<Tag color="green" style={{ fontSize: 10, margin: 0 }}>
									{art.category}
								</Tag>
							</div>
						))}
					</div>
				)}
			</div>
		</Modal>
	);
}
