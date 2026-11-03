<?php

namespace Modules\Auth\Services;

use Modules\User\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\System\Facades\Audit;
use Modules\System\Services\LoginLogService;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected LoginLogService $loginLogService,
        protected Google2FAService $google2FAService
    ) {}

    /**
     * Check if 2FA is globally enabled in config / env.
     */
    public function is2FAEnabled(): bool
    {
        return (bool) config('auth.two_factor.enabled', false);
    }

    /**
     * Retrieve 2FA configuration status.
     */
    public function get2faConfig(): array
    {
        return [
            'enabled' => $this->is2FAEnabled(),
        ];
    }

    /**
     * Authenticate user with credentials and issue personal access token (or initiate 2FA).
     */
    public function login(array $data, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $device = $this->detectDevice($userAgent);
        $user = $this->userRepository->findByEmail($data['email']);
        $logData = [
            'user_id' => $user?->id,
            'email' => $data['email'],
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device' => $device,
        ];

        $dummyHash = '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
        $passwordValid = Hash::check($data['password'], $user ? $user->password : $dummyHash);

        if (!$user || !$passwordValid) {
            $this->logAndFail($logData, 'invalid_credentials', ['email' => ['The provided credentials do not match our records.']]);
        }

        if ($user->status === 'blocked') {
            $this->logAndFail($logData, 'account_blocked', ['email' => ['This account has been blocked. Please contact support.']]);
        }

        if ($user->status === 'inactive') {
            $this->logAndFail($logData, 'account_inactive', ['email' => ['This account is inactive.']]);
        }

        // Check if 2FA is enabled in env/config
        if ($this->is2FAEnabled()) {
            return $this->initiate2FASession($user, $logData);
        }

        // Issue Sanctum token directly when 2FA is disabled
        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Verify 6-digit TOTP code and issue Sanctum token upon success.
     */
    public function verify2fa(string $tempToken, string $code): array
    {
        $cacheKey = "auth_2fa_temp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages([
                'code' => ['The 2FA verification session has expired or is invalid. Please sign in again.'],
            ]);
        }

        $secret = $data['secret'] ?? '';
        $isValid = $this->google2FAService->verifyKey($secret, $code);

        if (!$isValid) {
            throw ValidationException::withMessages([
                'code' => ['Invalid 2FA verification code. Please check your Google Authenticator app.'],
            ]);
        }

        /** @var User|null $user */
        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        // If user didn't have 2FA persisted, save secret and mark enabled
        if (empty($user->google2fa_secret) || !$user->google2fa_enabled) {
            $this->userRepository->update($user->id, [
                'google2fa_secret' => $secret,
                'google2fa_enabled' => true,
            ]);
        }

        Cache::forget($cacheKey);

        $logData = [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'device' => $data['device'] ?? 'Desktop',
        ];

        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Authenticate via Google ID / payload.
     */
    public function loginWithGoogle(array $data, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $email = $data['email'] ?? null;
        if (!$email && !empty($data['credential'])) {
            // Decode Google JWT payload if credential is provided
            $parts = explode('.', $data['credential']);
            if (count($parts) >= 2) {
                $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
                if (is_array($payload)) {
                    $email = $payload['email'] ?? null;
                    $data['name'] = $data['name'] ?? $payload['name'] ?? null;
                    $data['google_id'] = $data['google_id'] ?? $payload['sub'] ?? null;
                    $data['avatar'] = $data['avatar'] ?? $payload['picture'] ?? null;
                }
            }
        }

        if (!$email) {
            throw ValidationException::withMessages([
                'email' => ['Could not retrieve a valid email from Google account.'],
            ]);
        }

        $googleId = $data['google_id'] ?? null;
        $name = $data['name'] ?? explode('@', $email)[0];
        $avatar = $data['avatar'] ?? null;

        /** @var User|null $user */
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            $user = $this->userRepository->create([
                'name' => $name,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'password' => Hash::make(Str::random(32)),
                'status' => 'active',
                'is_admin' => false,
                'permission_type' => 'custom',
            ]);
        } else if (empty($user->google_id) && $googleId) {
            $this->userRepository->update($user->id, [
                'google_id' => $googleId,
                'avatar' => $user->avatar ?: $avatar,
            ]);
        }

        $device = $this->detectDevice($userAgent);
        $logData = [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device' => $device,
        ];

        if ($user->status === 'blocked') {
            $this->logAndFail($logData, 'account_blocked', ['email' => ['This account has been blocked. Please contact support.']]);
        }

        if ($user->status === 'inactive') {
            $this->logAndFail($logData, 'account_inactive', ['email' => ['This account is inactive.']]);
        }

        if ($this->is2FAEnabled()) {
            return $this->initiate2FASession($user, $logData);
        }

        return $this->finalizeLogin($user, $logData);
    }

    /**
     * Terminate the user's active session and revoke access tokens.
     */
    public function logout(User $user): void
    {
        $currentToken = $user->currentAccessToken();
        if ($currentToken) {
            $currentToken->delete();
        } else {
            $user->tokens()->delete();
        }
    }

    /**
     * Initiate 2FA session: generate temp token and return QR code data.
     */
    protected function initiate2FASession(User $user, array $logData): array
    {
        $tempToken = Str::random(64);
        $hasSecret = !empty($user->google2fa_secret);
        $secret = $hasSecret ? $user->google2fa_secret : $this->google2FAService->generateSecretKey();
        $qrCodeUrl = $this->google2FAService->getQRCodeUrl('TikTok Crawler CMS', $user->email, $secret);

        Cache::put("auth_2fa_temp_{$tempToken}", [
            'user_id' => $user->id,
            'secret' => $secret,
            'has_secret' => $hasSecret,
            'ip_address' => $logData['ip_address'] ?? null,
            'user_agent' => $logData['user_agent'] ?? null,
            'device' => $logData['device'] ?? 'Desktop',
        ], now()->addMinutes(5));

        return [
            'require_2fa' => true,
            'temp_token' => $tempToken,
            'has_secret' => $hasSecret,
            'qr_code_url' => $qrCodeUrl,
            'secret_key' => $secret,
        ];
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
            'require_2fa' => false,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUserData($user),
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

    public function getMe(User $user): array
    {
        return $this->formatUserData($user);
    }

    public function forgotPassword(string $email): string
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => [__('passwords.user')],
            ]);
        }

        $token = Password::createToken($user);

        Audit::record(
            action: 'REQUEST_RESET_PASSWORD',
            target: $user,
            metadata: ['email' => $email, 'method' => 'forgot_password'],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );

        return $token;
    }

    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match our records.'],
            ]);
        }

        $this->userRepository->update($user->id, [
            'password' => Hash::make($data['password']),
        ]);

        Audit::record(
            action: 'CHANGE_PASSWORD',
            target: $user,
            metadata: ['email' => $user->email],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );
    }

    public function updateProfile(User $user, array $data): array
    {
        $allowed = ['name', 'phone', 'avatar'];
        $updateData = array_intersect_key($data, array_flip($allowed));

        if (!empty($updateData)) {
            $this->userRepository->update($user->id, $updateData);
            $user->refresh();
        }

        Audit::record(
            action: 'UPDATE_PROFILE',
            target: $user,
            metadata: $updateData,
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );

        return $this->formatUserData($user);
    }

    public function resetPassword(array $credentials): void
    {
        /** @var User|null $resetUser */
        $resetUser = null;

        $status = Password::reset(
            $credentials,
            function (User $user, string $password) use (&$resetUser) {
                $resetUser = $user;
                $this->userRepository->update($user->id, [
                    'password' => Hash::make($password),
                ]);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            Audit::record(
                action: 'RESET_PASSWORD',
                target: $credentials['email'] ?? null,
                metadata: [
                    'email' => $credentials['email'] ?? null,
                    'reason' => 'invalid_or_expired_token',
                ],
                status: 'FAILED',
                errorMessage: __($status),
                module: 'AUTH',
                recordType: 'User'
            );

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        Audit::record(
            action: 'RESET_PASSWORD',
            target: $resetUser,
            metadata: [
                'email' => $resetUser?->email ?? $credentials['email'],
                'method' => 'token_reset',
            ],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $resetUser
        );
    }

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
            'google_id' => $user->google_id,
            'google2fa_enabled' => (bool) $user->google2fa_enabled,
            'roles' => $user->getRolesSlugs(),
            'permissions' => $user->getAllPermissionsSlugs(),
            'module_permissions' => $user->getModulePermissionsMatrix(),
        ];
    }

    private function logAndFail(array $logData, string $reason, array $messages): never
    {
        $logData['status'] = 'failed';
        $logData['failure_reason'] = $reason;
        $this->loginLogService->record($logData);

        throw ValidationException::withMessages($messages);
    }
}
