import { createAsyncThunk } from '@reduxjs/toolkit';
import * as authApi from '../../Action/auth';
import { AUTH_STORAGE_KEYS } from '../../configs/authConfig';

/**
 * Thunk to authenticate user and store token/user data in localStorage.
 */
export const loginThunk = createAsyncThunk(
    'auth/login',
    async (payload: authApi.LoginPayload, { rejectWithValue }) => {
        try {
            const res = await authApi.login(payload);
            const { token, user } = res.data;

            localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);

            return { token, user };
        } catch (error: any) {
            return rejectWithValue(
                error.message || 'Login failed. Please check your credentials.'
            );
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
            const user = res.data;

            return user;
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
