<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Modules\Auth\Jobs\PasswordResetNotification;
use Modules\Auth\Services\Interfaces\EmailOtpServiceInterface;
use Modules\Auth\Services\Interfaces\TwoFactorServiceInterface;
use Modules\System\Facades\Audit;
use Modules\System\Services\LoginLogService;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected LoginLogService $loginLogService,
        protected TwoFactorServiceInterface $twoFactorService,
        protected EmailOtpServiceInterface $emailOtpService
    ) {}

    /**
     * Authenticate user with email and password (direct login or initiate challenge).
     */
    public function login(array $data, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $user = $this->userRepository->findByEmail($data['email']);
        $logData = $this->buildLogData($user, $data['email'], $ipAddress, $userAgent);

        if ($user && $user->isGoogleAccount()) {
            $this->logAndFail($logData, 'google_account_only', ['email' => ['This account uses Google Sign-In. Please sign in with Google.']]);
        }

        $dummyHash = '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
        if (!$user || !Hash::check($data['password'], $user->password ?? $dummyHash)) {
            $this->logAndFail($logData, 'invalid_credentials', ['email' => ['The provided credentials do not match our records.']]);
        }

        $this->ensureUserCanAuthenticate($user, $logData);

        if ($this->emailOtpService->isEnabled()) {
            return $this->emailOtpService->sendOtp($user, $logData);
        }

        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Unified challenge code verification (auto-detects Email OTP or Google 2FA).
     */
    public function verifyCode(string $tempToken, string $code): array
    {
        if (Cache::has("auth_email_otp_{$tempToken}")) {
            return $this->verifyEmailOtp($tempToken, $code);
        }

        return $this->verify2fa($tempToken, $code);
    }

    /**
     * Verify email OTP code and finalize authentication.
     */
    public function verifyEmailOtp(string $tempToken, string $code): array
    {
        $session = $this->emailOtpService->verifyOtp($tempToken, $code);
        return $this->finalizeChallengeLogin($session);
    }

    /**
     * Resend fresh OTP code to user's email.
     */
    public function resendEmailOtp(string $tempToken): array
    {
        return $this->emailOtpService->resendOtp($tempToken);
    }

    /**
     * Fetch active 2FA challenge data for an existing temporary session.
     */
    public function get2FAChallenge(string $tempToken): ?array
    {
        return $this->twoFactorService->getChallenge($tempToken);
    }

    /**
     * Verify 6-digit TOTP code and issue Sanctum token upon success.
     */
    public function verify2fa(string $tempToken, string $code): array
    {
        $session = $this->twoFactorService->verify($tempToken, $code);
        return $this->finalizeChallengeLogin($session);
    }

    /**
     * Finalize authentication for a verified challenge session (Email OTP or 2FA).
     */
    protected function finalizeChallengeLogin(array $session): array
    {
        $user = $this->userRepository->findById($session['user_id']);
        if (!$user) {
            throw ValidationException::withMessages(['code' => ['User account not found.']]);
        }

        $logData = $this->buildLogData($user, null, $session['ip_address'] ?? null, $session['user_agent'] ?? null);

        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Authenticate via Google OAuth.
     */
    public function loginWithGoogle(array $data, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $email = $data['email'] ?? null;
        if (!$email) {
            throw ValidationException::withMessages(['email' => ['Google email is required.']]);
        }

        $logData = $this->buildLogData(null, $email, $ipAddress, $userAgent);
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            $this->logAndFail($logData, 'account_not_found', ['email' => ['This Google account is not registered. Please contact the administrator to create your account.']]);
        }

        $logData['user_id'] = $user->id;

        $googleId = $data['google_id'] ?? null;
        if (empty($user->google_id) && $googleId) {
            $this->userRepository->update($user->id, ['google_id' => $googleId, 'avatar' => $user->avatar ?: ($data['avatar'] ?? null)]);
            $user = $this->userRepository->findById($user->id);
        }

        $this->ensureUserCanAuthenticate($user, $logData);

        if ($this->twoFactorService->isEnabled()) {
            return $this->twoFactorService->initiateSession($user, $logData);
        }

        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Format current authenticated user profile and permissions matrix.
     */
    public function getMe(User $user): array
    {
        return $this->formatUserData($user);
    }

    /**
     * Terminate the user's active session and revoke access tokens.
     */
    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete() ?? $user->tokens()->delete();
    }

    /**
     * Generate password reset token and dispatch notification.
     */
    public function forgotPassword(string $email): void
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw new InvalidArgumentException('User account not found.');
        }

        if ($user->isGoogleAccount()) {
            throw new InvalidArgumentException('Password reset is not available for Google login accounts. Please sign in with Google.');
        }

        $this->sendPasswordResetLink($user, 'user');
    }

    /**
     * Reusable password reset token generation, URL construction, and queued notification dispatch.
     */
    public function sendPasswordResetLink(User $user, string $triggerBy = 'user'): void
    {
        try {
            Audit::track(
                action: 'REQUEST_RESET_PASSWORD',
                target: $user,
                execute: function () use ($user) {
                    $token = Password::createToken($user);
                    $resetUrl = config('app.url') . '/admin/auth/login?reset-password=1&token=' . $token . '&email=' . $user->email;
                    PasswordResetNotification::dispatch($user->email, $resetUrl, $user->name);
                },
                metadata: [
                    'target_email' => $user->email,
                    'trigger_by' => $triggerBy,
                ]
            );
        } catch (\Throwable $th) {
            throw new InvalidArgumentException('Failed to send reset password email.', previous: $th);
        }
    }

    /**
     * Reset account password using token.
     */
    public function resetPassword(array $credentials): void
    {
        $resetUser = null;

        $status = Password::reset($credentials, function (User $user, string $password) use (&$resetUser) {
            $resetUser = $user;
            $this->userRepository->update($user->id, ['password' => Hash::make($password)]);
        });

        if ($status !== Password::PASSWORD_RESET) {
            Audit::record(
                action: 'RESET_PASSWORD',
                target: $credentials['email'] ?? null,
                metadata: ['email' => $credentials['email'] ?? null, 'reason' => 'invalid_or_expired_token'],
                status: 'FAILED',
                errorMessage: __($status),
                module: 'AUTH',
                recordType: 'User'
            );

            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        Audit::record(
            action: 'RESET_PASSWORD',
            target: $resetUser,
            metadata: ['email' => $resetUser?->email ?? $credentials['email'], 'method' => 'token_reset'],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $resetUser
        );
    }

    /**
     * Ensure the user account is active and not blocked.
     */
    protected function ensureUserCanAuthenticate(User $user, array $logData): void
    {
        if ($user->status === 'blocked') {
            $this->logAndFail($logData, 'account_blocked', ['email' => ['This account has been blocked. Please contact support.']]);
        }

        if ($user->status === 'inactive') {
            $this->logAndFail($logData, 'account_inactive', ['email' => ['This account is inactive.']]);
        }
    }

    /**
     * Finalize successful login, record audit log, and return token.
     */
    protected function finalizeLogin(User $user, array $logData): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        $logData['status'] = 'success';
        $logData['failure_reason'] = null;
        $this->loginLogService->record($logData);

        return [
            'step' => 'completed',
            'require_2fa' => false,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUserData($user),
        ];
    }

    /**
     * Build standardized login log payload.
     */
    protected function buildLogData(?User $user, ?string $email = null, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        return [
            'user_id' => $user?->id,
            'email' => $user?->email ?? $email,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device' => $this->detectDevice($userAgent),
        ];
    }

    /**
     * Parse client device category from User-Agent.
     */
    protected function detectDevice(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown';
        }

        if (preg_match('/(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i', $userAgent)) {
            return 'Tablet';
        }

        if (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile|iphone)/i', $userAgent)) {
            return 'Mobile';
        }

        return 'Desktop';
    }

    /**
     * Format user data and relations into unified auth payload.
     */
    protected function formatUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'is_admin' => $user->isAdmin(),
            'auth_type' => $user->isGoogleAccount() ? 'google' : ($user->auth_type ?? 'password'),
            'google_id' => $user->google_id,
            'google2fa_enabled' => (bool) $user->google2fa_enabled,
            'roles' => $user->getRolesSlugs(),
            'permissions' => $user->getAllPermissionsSlugs(),
            'module_permissions' => $user->getModulePermissionsMatrix(),
        ];
    }

    /**
     * Record failure in login log and throw validation exception.
     */
    private function logAndFail(array $logData, string $reason, array $messages): never
    {
        $logData['status'] = 'failed';
        $logData['failure_reason'] = $reason;
        $this->loginLogService->record($logData);

        throw ValidationException::withMessages($messages);
    }
}
