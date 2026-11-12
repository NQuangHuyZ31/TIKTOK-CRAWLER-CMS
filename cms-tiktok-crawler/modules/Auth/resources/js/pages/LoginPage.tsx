import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Card, Typography, theme, Alert } from 'antd';
import { LockOutlined, MailOutlined, SafetyCertificateFilled } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from '@core/store';
import { AUTH_ROUTES, AUTH_STORAGE_KEYS } from '../configs/authConfig';
import { fetchMeThunk, verifyCodeThunk } from '../store/auth/authThunks';
import { setToken } from '../store/auth/authSlice';
import { get2FAChallenge, type TwoFactorChallengeData } from '../Action/auth';
import LoginForm from '../components/LoginForm';
import TwoFactorVerifyStep from '../components/TwoFactorVerifyStep';
import EmailOtpVerifyStep from '../components/EmailOtpVerifyStep';
import ResetPasswordForm from '../components/ResetPasswordForm';
import LoginHeroBanner from '../components/LoginHeroBanner';

const { Title, Text } = Typography;

export type AuthStep = 'login' | '2fa' | 'email_otp' | 'reset-password';

interface AuthState {
	step: AuthStep;
	loading: boolean;
	error: string | null;
	challenge: TwoFactorChallengeData | null;
	emailOtpData: { temp_token: string; email: string } | null;
}

export default function LoginPage() {
	const { token: antdTheme } = theme.useToken();
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();

	// Redirect destination
	const destination = useMemo(() => {
		const state = location.state as { from?: { pathname?: string } } | null;
		const target = state?.from?.pathname || AUTH_ROUTES.DEFAULT_REDIRECT;
		return target.startsWith('/admin') ? target : `/admin${target.startsWith('/') ? target : `/${target}`}`;
	}, [location.state]);

	// Consolidated State driven by step
	const initialStep: AuthStep = (searchParams.get('step') as AuthStep) || (searchParams.get('reset-password') === '1' ? 'reset-password' : 'login');

	const [state, setState] = useState<AuthState>({
		step: initialStep,
		loading: false,
		error: null,
		challenge: null,
		emailOtpData: null,
	});

	const handledOAuthRef = useRef(false);

	// Handle backend responses (?step=2fa&temp_token=..., ?token=..., ?error=...)
	useEffect(() => {
		if (searchParams.get('reset-password') === '1') return;

		if (handledOAuthRef.current) return;

		const step = searchParams.get('step');
		const token = searchParams.get('token');
		const tempToken = searchParams.get('temp_token');
		const error = searchParams.get('error');

		if (!step && !token && !tempToken && !error) return;

		handledOAuthRef.current = true;
		window.history.replaceState({}, document.title, window.location.pathname);

		if (error) {
			setState({ step: 'login', loading: false, error: decodeURIComponent(error), challenge: null, emailOtpData: null });
			return;
		}

		if (step === '2fa' || tempToken) {
			setState((s) => ({ ...s, step: '2fa', loading: true, error: null }));
			get2FAChallenge(tempToken!)
				.then((res) => {
					setState({ step: '2fa', loading: false, error: null, challenge: res.data, emailOtpData: null });
				})
				.catch((err) => {
					setState({ step: 'login', loading: false, error: err?.message || '2FA session expired.', challenge: null, emailOtpData: null });
				});
			return;
		}

		if (token && token !== 'undefined' && token !== 'null') {
			localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
			dispatch(setToken(token));
			dispatch(fetchMeThunk());
			window.location.href = destination;
		}
	}, [searchParams, dispatch, destination, navigate]);

	// Synchronize document title
	useEffect(() => {
		const titles: Record<AuthStep, string> = {
			login: 'Sign In - TikTok Crawler CMS',
			'2fa': 'Two-Factor Authentication - TikTok Crawler CMS',
			email_otp: 'Email Verification - TikTok Crawler CMS',
			'reset-password': 'Reset Password - TikTok Crawler CMS',
		};
		document.title = titles[state.step];
	}, [state.step]);

	// Unified challenge code verification (Google 2FA or Email OTP)
	const handleVerifyCode = async (otp: string) => {
		const tempToken = state.challenge?.temp_token || state.emailOtpData?.temp_token;
		if (!tempToken) return;

		setState((s) => ({ ...s, loading: true, error: null }));
		try {
			const res = await dispatch(
				verifyCodeThunk({
					temp_token: tempToken,
					code: otp.trim(),
				}),
			).unwrap();

			if (!res?.token || res.token === 'undefined') {
				throw new Error('Verification failed. Invalid token received.');
			}

			await dispatch(fetchMeThunk()).unwrap();
			window.location.href = destination;
		} catch (err: any) {
			setState((s) => ({
				...s,
				loading: false,
				error: typeof err === 'string' ? err : err?.message || 'Verification failed. Please check your code.',
			}));
		}
	};

	// Header metadata config based on current step
	const headerConfig = {
		login: {
			icon: <SafetyCertificateFilled style={{ fontSize: 24, color: antdTheme.colorPrimary }} />,
			bg: `${antdTheme.colorPrimary}18`,
			title: 'Welcome Back',
			desc: 'Sign in to access your crawler workspace',
		},
		'2fa': {
			icon: <SafetyCertificateFilled style={{ fontSize: 24, color: antdTheme.colorPrimary }} />,
			bg: `${antdTheme.colorPrimary}18`,
			title: 'Two-Factor Authentication',
			desc: 'Complete verification with Google Authenticator',
		},
		email_otp: {
			icon: <MailOutlined style={{ fontSize: 24, color: antdTheme.colorPrimary }} />,
			bg: `${antdTheme.colorPrimary}18`,
			title: 'Email Verification',
			desc: 'Enter the 6-digit code sent to your email',
		},
		'reset-password': {
			icon: <LockOutlined style={{ fontSize: 24, color: '#10b981' }} />,
			bg: '#10b98118',
			title: 'Password Assistance',
			desc: 'Manage and reset your account credentials',
		},
	}[state.step];

	// Common body render delegator
	const renderStepBody = () => {
		switch (state.step) {
			case '2fa':
				return state.challenge ? (
					<TwoFactorVerifyStep
						challenge={state.challenge}
						loading={state.loading}
						error={state.error}
						onVerify={handleVerifyCode}
						onBack={() => setState({ step: 'login', loading: false, error: null, challenge: null, emailOtpData: null })}
					/>
				) : null;

			case 'email_otp':
				return state.emailOtpData ? (
					<EmailOtpVerifyStep
						tempToken={state.emailOtpData.temp_token}
						email={state.emailOtpData.email}
						loading={state.loading}
						error={state.error}
						onVerify={handleVerifyCode}
						onBack={() => setState({ step: 'login', loading: false, error: null, challenge: null, emailOtpData: null })}
					/>
				) : null;

			case 'reset-password':
				return (
					<ResetPasswordForm
						initialEmail={searchParams.get('email') || ''}
						initialToken={searchParams.get('token') || ''}
						onBackToLogin={() => setState({ step: 'login', loading: false, error: null, challenge: null, emailOtpData: null })}
					/>
				);

			case 'login':
			default:
				return (
					<LoginForm
						onSuccess={() => {
							window.location.href = destination;
						}}
						onRequireEmailOtp={(data) => setState({ step: 'email_otp', loading: false, error: null, challenge: null, emailOtpData: data })}
						onForgotPassword={() => setState((s) => ({ ...s, step: 'reset-password', error: null }))}
						onGoogleLoginClick={() => {
							setState((s) => ({ ...s, loading: true, error: null }));
							window.location.href = '/admin/api/auth/google/redirect';
						}}
						googleLoading={state.loading}
					/>
				);
		}
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'radial-gradient(circle at 10% 20%, #0b1120 0%, #030712 100%)',
				padding: 24,
			}}
		>
			<Card
				style={{
					width: '100%',
					maxWidth: 960,
					borderRadius: 20,
					overflow: 'hidden',
					border: '1px solid rgba(255, 255, 255, 0.08)',
					boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
				}}
				styles={{ body: { padding: 0 } }}
			>
				<div style={{ display: 'flex', minHeight: 560 }}>
					<div className="hidden lg:flex" style={{ width: '48%', display: 'flex' }}>
						<LoginHeroBanner />
					</div>
					<div style={{ flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
						<div style={{ textAlign: 'center', marginBottom: 28 }}>
							<div
								style={{
									width: 52,
									height: 52,
									borderRadius: 14,
									background: headerConfig.bg,
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 14,
								}}
							>
								{headerConfig.icon}
							</div>
							<Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
								{headerConfig.title}
							</Title>
							<Text type="secondary" style={{ fontSize: 13 }}>
								{headerConfig.desc}
							</Text>
						</div>

						{state.error && state.step !== '2fa' && state.step !== 'email_otp' && (
							<Alert type="error" showIcon message={state.error} style={{ marginBottom: 16, borderRadius: 8 }} closable onClose={() => setState((s) => ({ ...s, error: null }))} />
						)}

						{renderStepBody()}
					</div>
				</div>
			</Card>
		</div>
	);
}
