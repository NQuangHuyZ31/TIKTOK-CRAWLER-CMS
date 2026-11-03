import { api } from '@core/Action/api';
import type { UserProfile } from '../configs/authConfig';

export interface LoginPayload {
	email: string;
	password: string;
}

export interface TwoFactorChallengeData {
	require_2fa: true;
	temp_token: string;
	has_secret: boolean;
	qr_code_url: string;
	secret_key: string;
}

export interface LoginSuccessData {
	require_2fa: false;
	token: string;
	token_type: string;
	user: UserProfile;
}

export type LoginResponseData = LoginSuccessData | TwoFactorChallengeData;

export interface Verify2FAPayload {
	temp_token: string;
	code: string;
}

export interface GoogleLoginPayload {
	credential?: string;
	email?: string;
	name?: string;
	google_id?: string;
	avatar?: string;
}

export interface ResetPasswordPayload {
	email: string;
	token: string;
	password: string;
	password_confirmation: string;
}

/**
 * Authenticate user with credentials and issue Bearer token (or prompt for 2FA).
 * API: POST /auth/login
 */
export const login = (data: LoginPayload) =>
	api<{ status: string; data: LoginResponseData; message: string }>('/auth/login', {
		method: 'POST',
		data,
	});

/**
 * Verify 6-digit TOTP code and finalize authentication.
 * API: POST /auth/auth/verify-2fa
 */
export const verify2FA = (data: Verify2FAPayload) =>
	api<{ status: string; data: LoginSuccessData; message: string }>('/auth/auth/verify-2fa', {
		method: 'POST',
		data,
	});

/**
 * Sign in via Google ID / OAuth payload.
 * API: POST /auth/auth/google-login
 */
export const googleLogin = (data: GoogleLoginPayload) =>
	api<{ status: string; data: LoginResponseData; message: string }>('/auth/auth/google-login', {
		method: 'POST',
		data,
	});

/**
 * Fetch 2FA configuration status from backend.
 * API: GET /auth/auth/config-2fa
 */
export const get2FAConfig = () =>
	api<{ status: string; data: { enabled: boolean }; message: string }>('/auth/auth/config-2fa');

/**
 * Revoke the current access token and log out the user.
 * API: POST /auth/logout
 */
export const logout = () =>
	api<{ status: string; message: string }>('/auth/logout', {
		method: 'POST',
	});

/**
 * Fetch authenticated user profile with roles and module permissions matrix.
 * API: GET /auth/me
 */
export const getMe = () =>
	api<{ status: string; data: UserProfile; message: string }>('/auth/me');

/**
 * Reset account password with token.
 * API: POST /auth/reset-password
 */
export const resetPassword = (data: ResetPasswordPayload) =>
	api<{ status: string; message: string }>('/auth/reset-password', {
		method: 'POST',
		data,
	});
