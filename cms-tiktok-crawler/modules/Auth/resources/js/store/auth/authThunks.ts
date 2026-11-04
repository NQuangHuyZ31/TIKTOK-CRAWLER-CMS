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
			const data = (res as any)?.data ?? res;

			if (data?.require_2fa || data?.require_otp || data?.step === '2fa' || data?.step === 'email_otp') {
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
 * Unified thunk to verify 6-digit challenge code (Email OTP or Google 2FA).
 */
export const verifyCodeThunk = createAsyncThunk(
	'auth/verifyCode',
	async (payload: authApi.VerifyCodePayload, { rejectWithValue }) => {
		try {
			const res = await authApi.verifyCode(payload);
			const data = (res as any)?.data ?? res;

			localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, data.token);
			return data;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Verification failed. Please check your code.');
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
