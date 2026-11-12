import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'cms_theme_mode';

export interface ThemeContextValue {
	themeMode: ThemeMode;
	isDark: boolean;
	setThemeMode: (mode: ThemeMode) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeMode {
	if (typeof window === 'undefined') {
		return 'dark';
	}
	try {
		const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (saved === 'light' || saved === 'dark') {
			return saved;
		}
	} catch {
		// Ignore storage access errors
	}
	return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialTheme);

	useEffect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = themeMode;
			document.documentElement.style.colorScheme = themeMode;
		}
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
			} catch {
				// Ignore storage access errors
			}
		}
	}, [themeMode]);

	const setThemeMode = useCallback((mode: ThemeMode) => {
		setThemeModeState(mode);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
	}, []);

	return (
		<ThemeContext.Provider
			value={{
				themeMode,
				isDark: themeMode === 'dark',
				setThemeMode,
				toggleTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
