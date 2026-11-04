import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../configs/authConfig';
import { AUTH_STORAGE_KEYS } from '../../configs/authConfig';
import { fetchMeThunk, loginThunk, logoutThunk, verifyCodeThunk } from './authThunks';

export interface AuthState {
	user: UserProfile | null;
	token: string | null;
	roles: string[];
	permissions: string[];
	modulePermissions: Record<string, { view: boolean; edit: boolean }>;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
}

const getStoredToken = (): string | null => {
	try {
		return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
	} catch {
		return null;
	}
};

const initialToken = getStoredToken();

const initialState: AuthState = {
	user: null,
	token: initialToken,
	roles: [],
	permissions: [],
	modulePermissions: {},
	isAuthenticated: Boolean(initialToken),
	loading: false,
	error: null,
};

function applyAuthSuccess(state: AuthState, action: PayloadAction<any>): void {
	state.loading = false;
	const payload = action.payload?.data ?? action.payload;
	if (payload?.require_2fa || payload?.require_otp || payload?.step === '2fa' || payload?.step === 'email_otp') {
		state.isAuthenticated = false;
		state.token = null;
		state.user = null;
		return;
	}
	state.token = payload.token;
	state.user = payload.user;
	state.roles = payload.user?.roles || [];
	state.permissions = payload.user?.permissions || [];
	state.modulePermissions = payload.user?.module_permissions || {};
	state.isAuthenticated = true;
	state.error = null;
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setToken: (state, action: PayloadAction<string | null>) => {
			state.token = action.payload;
			state.isAuthenticated = Boolean(action.payload);
			if (action.payload) {
				localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, action.payload);
			} else {
				localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
			}
		},
		setUser: (state, action: PayloadAction<UserProfile | null>) => {
			state.user = action.payload;
			state.roles = action.payload?.roles || [];
			state.permissions = action.payload?.permissions || [];
			state.modulePermissions = action.payload?.module_permissions || {};
		},
		clearError: (state) => {
			state.error = null;
		},
		resetAuthState: (state) => {
			Object.assign(state, initialState, { token: null, isAuthenticated: false });
			localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
		},
	},
	extraReducers: (builder) => {
		// Password Login
		builder
			.addCase(loginThunk.pending, (s) => { s.loading = true; s.error = null; })
			.addCase(loginThunk.fulfilled, applyAuthSuccess)
			.addCase(loginThunk.rejected, (s, a) => { s.loading = false; s.error = (a.payload as string) || 'Authentication failed.'; });

		// Challenge Code Verification (Email OTP / 2FA)
		builder
			.addCase(verifyCodeThunk.pending, (s) => { s.loading = true; s.error = null; })
			.addCase(verifyCodeThunk.fulfilled, applyAuthSuccess)
			.addCase(verifyCodeThunk.rejected, (s, a) => { s.loading = false; s.error = (a.payload as string) || 'Verification failed.'; });

		// Fetch Current User
		builder
			.addCase(fetchMeThunk.fulfilled, (s, a) => {
				s.user = a.payload;
				s.roles = a.payload.roles || [];
				s.permissions = a.payload.permissions || [];
				s.modulePermissions = a.payload.module_permissions || {};
			})
			.addCase(fetchMeThunk.rejected, (s) => {
				s.isAuthenticated = false;
				s.token = null;
				s.user = null;
				localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
			});

		// Logout
		builder
			.addCase(logoutThunk.pending, (s) => { s.loading = true; })
			.addCase(logoutThunk.fulfilled, (s) => {
				s.loading = false;
				s.user = null;
				s.token = null;
				s.roles = [];
				s.permissions = [];
				s.modulePermissions = {};
				s.isAuthenticated = false;
			});
	},
});

export const { setToken, setUser, clearError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
