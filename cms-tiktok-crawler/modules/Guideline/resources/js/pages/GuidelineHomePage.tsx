import React, { useState } from 'react';
import DocNavbar from '../components/layout/DocNavbar';
import DocSidebar from '../components/layout/DocSidebar';
import DocHomeContent from '../components/home/DocHomeContent';
import DocSearchModal from '../components/search/DocSearchModal';
import { DocLanguageProvider } from '../context/DocLanguageContext';

function GuidelineHomePageContent() {
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', display: 'flex', flexDirection: 'column' }}>
			<DocNavbar onOpenSearch={() => setIsSearchOpen(true)} />

			<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
				{/* Left Hierarchical Navigation Sidebar */}
				<DocSidebar />

				{/* Center Content Reading Area */}
				<main style={{ flex: 1, minWidth: 0, padding: '24px 36px 60px', overflowY: 'auto' }}>
					<DocHomeContent onOpenSearch={() => setIsSearchOpen(true)} />
				</main>
			</div>

			{/* Global Search Modal (Ctrl + K) */}
			<DocSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
		</div>
	);
}

export default function GuidelineHomePage() {
	return (
		<DocLanguageProvider>
			<GuidelineHomePageContent />
		</DocLanguageProvider>
	);
}
