import { api } from '@core/Action/api';
import type { UserProfile } from '../configs/authConfig';

export interface LoginPayload {
	email: string;
	password: string;
}

export interface TwoFactorChallengeData {
	step?: '2fa';
	require_2fa: true;
	require_otp?: false;
	enrolled: boolean;
	temp_token: string;
	has_secret?: boolean;
	qr_code_url?: string;
	secret_key?: string;
	email?: string;
}

export interface LoginSuccessData {
	step?: 'completed';
	require_2fa: false;
	require_otp?: false;
	token: string;
	token_type: string;
	user: UserProfile;
}

export interface EmailOtpChallengeData {
	step: 'email_otp';
	require_otp: true;
	require_2fa?: false;
	temp_token: string;
	email: string;
	message?: string;
}

export type LoginResponseData = LoginSuccessData | TwoFactorChallengeData | EmailOtpChallengeData;

export interface VerifyCodePayload {
	temp_token: string;
	code: string;
}

export interface ResetPasswordPayload {
	email: string;
	token: string;
	password: string;
	password_confirmation: string;
}

/**
 * Authenticate user with credentials and issue Bearer token (or prompt for 2FA).
 */
export const login = (data: LoginPayload) =>
	api<{ status: string; data: LoginResponseData; message: string }>('/auth/login', {
		method: 'POST',
		data,
	});

/**
 * Unified verification for 6-digit challenge code (Email OTP or Google 2FA).
 */
export const verifyCode = (data: VerifyCodePayload) =>
	api<{ status: string; data: LoginSuccessData; message: string }>('/auth/auth/verify-code', {
		method: 'POST',
		data,
	});

/**
 * Resend fresh email OTP code.
 */
export const resendEmailOtp = (temp_token: string) =>
	api<{ status: string; data: EmailOtpChallengeData; message: string }>('/auth/auth/resend-email-otp', {
		method: 'POST',
		data: { temp_token },
	});

/**
 * Retrieve active 2FA challenge data using temporary token.
 */
export const get2FAChallenge = (temp_token: string) =>
	api<{ status: string; data: TwoFactorChallengeData; message: string }>(
		`/auth/auth/challenge-2fa?temp_token=${encodeURIComponent(temp_token)}`
	);

/**
 * Revoke the current access token and log out the user.
 */
export const logout = () =>
	api<{ status: string; message: string }>('/auth/logout', {
		method: 'POST',
	});

/**
 * Fetch authenticated user profile with roles and module permissions matrix.
 */
export const getMe = () =>
	api<{ status: string; data: UserProfile; message: string }>('/auth/me');

/**
 * Initiate forgot password flow by requesting a password reset email.
 */
export const forgotPassword = (email: string) =>
	api<{ status: string; data?: { token?: string } | null; message: string }>('/auth/auth/forgot-password', {
		method: 'POST',
		data: { email },
	});

/**
 * Reset account password with token.
 */
export const resetPassword = (data: ResetPasswordPayload) =>
	api<{ status: string; message: string }>('/auth/reset-password', {
		method: 'POST',
		data,
	});
