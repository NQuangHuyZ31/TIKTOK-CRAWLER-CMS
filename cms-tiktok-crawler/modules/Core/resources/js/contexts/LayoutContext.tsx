import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface LayoutContextValue {
	collapsed: boolean;
	setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
	toggleCollapsed: () => void;
	mobileDrawerOpen: boolean;
	setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	toggleMobileDrawer: () => void;
	isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	const [isMobile, setIsMobile] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			return window.innerWidth < 992;
		}
		return false;
	});

	const [collapsed, setCollapsed] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			return window.innerWidth < 992;
		}
		return false;
	});
	const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

	// Detect window resizing with debounce-free responsive state
	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 992;
			setIsMobile(mobile);
			if (mobile) {
				setCollapsed(true);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Auto-close mobile drawer when user navigates
	useEffect(() => {
		if (isMobile) {
			setMobileDrawerOpen(false);
		}
	}, [location.pathname, isMobile]);

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev) => !prev);
	}, []);

	const toggleMobileDrawer = useCallback(() => {
		setMobileDrawerOpen((prev) => !prev);
	}, []);

	return (
		<LayoutContext.Provider
			value={{
				collapsed,
				setCollapsed,
				toggleCollapsed,
				mobileDrawerOpen,
				setMobileDrawerOpen,
				toggleMobileDrawer,
				isMobile,
			}}
		>
			{children}
		</LayoutContext.Provider>
	);
}

export function useLayout(): LayoutContextValue {
	const context = useContext(LayoutContext);
	if (!context) {
		throw new Error('useLayout must be used within a LayoutProvider');
	}
	return context;
}
