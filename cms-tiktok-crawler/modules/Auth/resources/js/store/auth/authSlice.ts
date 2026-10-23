import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../configs/authConfig';
import { AUTH_STORAGE_KEYS } from '../../configs/authConfig';
import { fetchMeThunk, loginThunk, logoutThunk } from './authThunks';

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
            state.user = null;
            state.token = null;
            state.roles = [];
            state.permissions = [];
            state.modulePermissions = {};
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.roles = action.payload.user.roles || [];
                state.permissions = action.payload.user.permissions || [];
                state.modulePermissions = action.payload.user.module_permissions || {};
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || 'Authentication failed.';
            });

        // Fetch Me
        builder
            .addCase(fetchMeThunk.fulfilled, (state, action) => {
                state.user = action.payload;
                state.roles = action.payload.roles || [];
                state.permissions = action.payload.permissions || [];
                state.modulePermissions = action.payload.module_permissions || {};
            })
            .addCase(fetchMeThunk.rejected, (state) => {
                // Invalid or expired token: clear credentials
                state.isAuthenticated = false;
                state.token = null;
                state.user = null;
                localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
            });

        // Logout
        builder
            .addCase(logoutThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutThunk.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.roles = [];
                state.permissions = [];
                state.modulePermissions = {};
                state.isAuthenticated = false;
            });
    },
});

export const { setToken, setUser, clearError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
