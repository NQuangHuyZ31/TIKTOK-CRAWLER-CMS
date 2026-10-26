import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from '@core/store';
import { fetchMeThunk, logoutThunk } from '@modules/Auth/resources/js/store/auth/authThunks';
import { Spin } from 'antd';

export interface AuthContextType {
	isAuthenticated: boolean;
	user: any | null;
	roles: string[];
	modulePermissions: Record<string, any>;
	loading: boolean;
	logout: () => void;
	refetchMe: () => void;
}
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const dispatch = useDispatch();
	const { isAuthenticated, user, roles, modulePermissions, loading } = useSelector((state: any) => state.auth);

	useEffect(() => {
		if (isAuthenticated && !user) {
			dispatch(fetchMeThunk());
		}
	}, [user, loading, dispatch]);

	const handleLogout = useCallback(() => {
		if (logoutThunk) {
			dispatch(logoutThunk());
		}
	}, [dispatch]);

	const handleRefetchMe = useCallback(() => {
		dispatch(fetchMeThunk());
	}, [dispatch]);

	const value = useMemo<AuthContextType>(() => {
		return {
			isAuthenticated,
			user,
			roles: roles || [],
			modulePermissions: modulePermissions || {},
			loading,
			logout: handleLogout,
			refetchMe: handleRefetchMe,
		};
	}, [isAuthenticated, user, roles, modulePermissions, loading, handleLogout, handleRefetchMe]);

	if (isAuthenticated && !user) {
		return (
			<div style={{ padding: 48, textAlign: 'center' }}>
				<Spin size="large" tip="Verifying access permissions..." />
			</div>
		);
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuthContext must be used within AuthProvider');
	}
	return ctx;
}
