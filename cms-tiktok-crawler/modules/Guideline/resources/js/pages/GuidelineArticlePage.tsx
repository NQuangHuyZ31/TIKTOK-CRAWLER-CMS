import React, { useEffect, useState } from 'react';
import { theme } from 'antd';
import { useParams } from 'react-router-dom';
import DocNavbar from '../components/layout/DocNavbar';
import DocSidebar from '../components/layout/DocSidebar';
import DocArticleRenderer from '../components/article/DocArticleRenderer';
import DocRightToc from '../components/layout/DocRightToc';
import DocSearchModal from '../components/search/DocSearchModal';
import DocNotFound from '../components/common/DocNotFound';
import { findArticleBySlug } from '../navigation/docTree';
import { DocLanguageProvider, useDocLanguage } from '../context/DocLanguageContext';

function GuidelineArticlePageContent() {
	const { token } = theme.useToken();
	const { pillar, slug } = useParams<{ pillar: string; slug: string }>();
	const { language } = useDocLanguage();
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const article = pillar && slug ? findArticleBySlug(pillar, slug, language) : undefined;

	// Scroll to top when slug or language changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [pillar, slug, language]);

	return (
		<div style={{ minHeight: '100vh', backgroundColor: token.colorBgLayout, display: 'flex', flexDirection: 'column' }}>
			<DocNavbar onOpenSearch={() => setIsSearchOpen(true)} />

			<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
				{/* Left Hierarchical Navigation Sidebar */}
				<DocSidebar />

				{/* Center Content Reading Area */}
				<main style={{ flex: 1, minWidth: 0, padding: '24px 36px 60px', overflowY: 'auto' }}>
					{article ? <DocArticleRenderer article={article} /> : <DocNotFound />}
				</main>

				{/* Right "On this page" TOC Sidebar */}
				{article && (
					<div className="guideline-right-toc-container">
						<DocRightToc blocks={article.blocks} />
					</div>
				)}
			</div>

			{/* Global Search Modal (Ctrl + K) */}
			<DocSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
		</div>
	);
}

export default function GuidelineArticlePage() {
	return (
		<DocLanguageProvider>
			<GuidelineArticlePageContent />
		</DocLanguageProvider>
	);
}
