import React, { createContext, useContext, useEffect, useState } from 'react';

export type DocLanguage = 'en' | 'vi';

interface DocLanguageContextType {
	language: DocLanguage;
	setLanguage: (lang: DocLanguage) => void;
	t: (key: string, enText: string, viText: string) => string;
}

const STORAGE_KEY = 'guideline_docs_language';

const DocLanguageContext = createContext<DocLanguageContextType>({
	language: 'en',
	setLanguage: () => {},
	t: (_k, en, _vi) => en,
});

export function DocLanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<DocLanguage>(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === 'vi' || saved === 'en') {
				return saved;
			}
		} catch {
			// fallback
		}
		return 'en';
	});

	const setLanguage = (lang: DocLanguage) => {
		setLanguageState(lang);
		try {
			localStorage.setItem(STORAGE_KEY, lang);
		} catch {
			// ignore storage errors
		}
	};

	const t = (_key: string, enText: string, viText: string) => {
		return language === 'vi' ? viText : enText;
	};

	return (
		<DocLanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</DocLanguageContext.Provider>
	);
}

export function useDocLanguage() {
	return useContext(DocLanguageContext);
}
