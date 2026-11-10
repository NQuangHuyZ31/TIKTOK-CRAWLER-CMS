import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import type { DocBlock } from '../../types/docSchema';
import { useDocLanguage } from '../../context/DocLanguageContext';

const { Text } = Typography;

interface DocRightTocProps {
	blocks: DocBlock[];
}

export default function DocRightToc({ blocks }: DocRightTocProps) {
	const { t } = useDocLanguage();
	const headings = blocks.filter(
		(b): b is Extract<DocBlock, { type: 'heading' }> => b.type === 'heading'
	);

	const [activeAnchor, setActiveAnchor] = useState<string>('');

	useEffect(() => {
		const handleScroll = () => {
			const scrollPos = window.scrollY + 100;
			for (let i = headings.length - 1; i >= 0; i--) {
				const el = document.getElementById(headings[i].anchorId);
				if (el && el.offsetTop <= scrollPos) {
					setActiveAnchor(headings[i].anchorId);
					return;
				}
			}
			if (headings.length > 0) {
				setActiveAnchor(headings[0].anchorId);
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener('scroll', handleScroll);
	}, [headings]);

	if (headings.length === 0) return null;

	const handleScrollTo = (anchorId: string) => {
		const el = document.getElementById(anchorId);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	return (
		<div
			style={{
				width: 210,
				flexShrink: 0,
				position: 'sticky',
				top: 76,
				height: 'calc(100vh - 80px)',
				overflowY: 'auto',
				padding: '8px 0 20px 16px',
				borderLeft: '1px solid #f0f0f0',
			}}
		>
			<Text
				strong
				style={{
					fontSize: 11,
					textTransform: 'uppercase',
					color: '#8c8c8c',
					letterSpacing: 0.6,
					display: 'block',
					marginBottom: 10,
				}}
			>
				{t('toc.title', 'On this page', 'Mục lục bài viết')}
			</Text>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
				{headings.map((h) => {
					const isActive = activeAnchor === h.anchorId;
					return (
						<a
							key={h.anchorId}
							onClick={(e) => {
								e.preventDefault();
								handleScrollTo(h.anchorId);
							}}
							href={`#${h.anchorId}`}
							style={{
								fontSize: 12,
								color: isActive ? '#1677ff' : '#595959',
								fontWeight: isActive ? 600 : 400,
								textDecoration: 'none',
								paddingLeft: h.level === 3 ? 12 : 0,
								lineHeight: 1.5,
								transition: 'color 0.15s ease',
							}}
						>
							{h.text}
						</a>
					);
				})}
			</div>
		</div>
	);
}
