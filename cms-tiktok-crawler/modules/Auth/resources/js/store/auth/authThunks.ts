import { createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../Action/auth';
import { AUTH_STORAGE_KEYS } from '../../configs/authConfig';

/**
 * Thunk to authenticate user with credentials (supporting 2FA challenge).
 */
export const loginThunk = createAsyncThunk(
	'auth/login',
	async (payload: authApi.LoginPayload, { rejectWithValue }) => {
		try {
			const res = await authApi.login(payload);
			const data = res.data;

			if (data.require_2fa) {
				return data;
			}

			const successData = data as authApi.LoginSuccessData;
			localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, successData.token);
			return successData;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Login failed. Please check your credentials.');
		}
	}
);

/**
 * Thunk to verify 6-digit TOTP code and finalize authentication.
 */
export const verify2FAThunk = createAsyncThunk(
	'auth/verify2FA',
	async (payload: authApi.Verify2FAPayload, { rejectWithValue }) => {
		try {
			const res = await authApi.verify2FA(payload);
			const data = res.data;

			localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, data.token);
			return data;
		} catch (error: any) {
			return rejectWithValue(error.message || '2FA verification failed.');
		}
	}
);

/**
 * Thunk to sign in via Google OAuth payload.
 */
export const googleLoginThunk = createAsyncThunk(
	'auth/googleLogin',
	async (payload: authApi.GoogleLoginPayload, { rejectWithValue }) => {
		try {
			const res = await authApi.googleLogin(payload);
			const data = res.data;

			if (data.require_2fa) {
				return data;
			}

			const successData = data as authApi.LoginSuccessData;
			localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, successData.token);
			return successData;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Google sign-in failed.');
		}
	}
);

/**
 * Thunk to fetch current authenticated user profile.
 */
export const fetchMeThunk = createAsyncThunk(
	'auth/fetchMe',
	async (_, { rejectWithValue }) => {
		try {
			const res = await authApi.getMe();
			return res.data;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to fetch user profile.');
		}
	}
);

/**
 * Thunk to log out user and clear storage.
 */
export const logoutThunk = createAsyncThunk(
	'auth/logout',
	async (_, { rejectWithValue }) => {
		try {
			await authApi.logout();
		} catch {
			// Even if server call fails, proceed with local cleanup
		} finally {
			localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
		}
		return true;
	}
);
