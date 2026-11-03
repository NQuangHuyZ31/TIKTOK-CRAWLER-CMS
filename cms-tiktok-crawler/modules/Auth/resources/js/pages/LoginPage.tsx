import React, { useEffect, useState } from 'react';
import { Card, Typography, theme } from 'antd';
import { LockOutlined, SafetyCertificateFilled } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from '@core/store';
import { verify2FAThunk, googleLoginThunk } from '../store/auth/authThunks';
import { AUTH_ROUTES } from '../configs/authConfig';
import type { TwoFactorChallengeData } from '../Action/auth';
import LoginForm from '../components/LoginForm';
import TwoFactorVerifyStep from '../components/TwoFactorVerifyStep';
import ResetPasswordForm from '../components/ResetPasswordForm';
import LoginHeroBanner from '../components/LoginHeroBanner';

const { Title, Text } = Typography;

export default function LoginPage() {
	const { token } = theme.useToken();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams, setSearchParams] = useSearchParams();

	const isResetMode = searchParams.get('reset-password') === '1' || searchParams.has('reset_password');
	const [step, setStep] = useState<'login' | '2fa'>('login');
	const [challenge, setChallenge] = useState<TwoFactorChallengeData | null>(null);
	const [verifyLoading, setVerifyLoading] = useState(false);
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const [googleLoading, setGoogleLoading] = useState(false);

	const from = (location.state as any)?.from?.pathname || AUTH_ROUTES.DEFAULT_REDIRECT;

	useEffect(() => {
		const titles: Record<string, string> = {
			reset: 'Reset Password - TikTok Crawler CMS',
			'2fa': 'Two-Factor Authentication - TikTok Crawler CMS',
			login: 'Sign In - TikTok Crawler CMS',
		};
		document.title = isResetMode ? titles.reset : titles[step];
	}, [isResetMode, step]);

	const handleVerify2FA = async (otp: string) => {
		if (!challenge) return;
		setVerifyLoading(true);
		setVerifyError(null);
		try {
			const res = await dispatch(verify2FAThunk({ temp_token: challenge.temp_token, code: otp }));
			if (verify2FAThunk.fulfilled.match(res)) navigate(from, { replace: true });
			else setVerifyError((res.payload as string) || 'Invalid 2FA code.');
		} catch (e: any) {
			setVerifyError(e.message || 'Verification failed.');
		} finally {
			setVerifyLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setGoogleLoading(true);
		try {
			const res = await dispatch(googleLoginThunk({ email: 'admin@cms.com', name: 'Google Admin' }));
			if (googleLoginThunk.fulfilled.match(res)) {
				const payload = res.payload as any;
				if (payload?.require_2fa) {
					setChallenge(payload);
					setStep('2fa');
				} else navigate(from, { replace: true });
			}
		} finally {
			setGoogleLoading(false);
		}
	};

	const cardStyle: React.CSSProperties = {
		width: '100%', maxWidth: 960, borderRadius: 20, overflow: 'hidden',
		border: '1px solid rgba(255, 255, 255, 0.08)',
		boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)', background: '#ffffff',
	};

	return (
		<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 10% 20%, #0b1120 0%, #030712 100%)', padding: 24 }}>
			<Card style={cardStyle} styles={{ body: { padding: 0 } }}>
				<div style={{ display: 'flex', minHeight: 560 }}>
					<div className="hidden lg:flex" style={{ width: '48%', display: 'flex' }}>
						<LoginHeroBanner />
					</div>
					<div style={{ flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
						<div style={{ textAlign: 'center', marginBottom: 28 }}>
							<div style={{ width: 52, height: 52, borderRadius: 14, background: isResetMode ? '#10b98118' : `${token.colorPrimary}18`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
								{isResetMode ? <LockOutlined style={{ fontSize: 24, color: '#10b981' }} /> : <SafetyCertificateFilled style={{ fontSize: 24, color: token.colorPrimary }} />}
							</div>
							<Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
								{isResetMode ? 'Set New Password' : step === '2fa' ? 'Two-Factor Authentication' : 'Welcome Back'}
							</Title>
							<Text type="secondary" style={{ fontSize: 13 }}>
								{isResetMode ? 'Create a strong new password' : step === '2fa' ? 'Verify your identity to proceed' : 'Sign in to access your crawler workspace'}
							</Text>
						</div>

						{isResetMode ? (
							<ResetPasswordForm onBackToLogin={() => setSearchParams({}, { replace: true })} />
						) : step === '2fa' && challenge ? (
							<TwoFactorVerifyStep challenge={challenge} loading={verifyLoading} error={verifyError} onVerify={handleVerify2FA} onBack={() => setStep('login')} />
						) : (
							<LoginForm
								onRequire2FA={(d) => { setChallenge(d); setVerifyError(null); setStep('2fa'); }}
								onForgotPassword={() => setSearchParams({ 'reset-password': '1' })}
								onGoogleLoginClick={handleGoogleLogin}
								googleLoading={googleLoading}
							/>
						)}
					</div>
				</div>
			</Card>
		</div>
	);
}
