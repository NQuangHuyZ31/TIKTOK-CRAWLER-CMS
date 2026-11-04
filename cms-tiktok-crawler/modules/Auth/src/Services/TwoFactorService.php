<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Services\Interfaces\TwoFactorServiceInterface;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class TwoFactorService implements TwoFactorServiceInterface
{
    public const MAX_OTP_ATTEMPTS = 5;
    public const CHALLENGE_TTL_MINUTES = 5;

    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected Google2FAService $google2faService
    ) {}

    /**
     * Check if 2FA authentication is globally enabled in config / env.
     */
    public function isEnabled(): bool
    {
        return (bool) config('auth.two_factor.enabled', false);
    }

    /**
     * Initiate a temporary 2FA session:
     */
    public function initiateSession(User $user, array $context = []): array
    {
        $tempToken = Str::random(64);
        $isEnrolled = !empty($user->google2fa_secret) && (bool) $user->google2fa_enabled;

        $secret = $isEnrolled ? $user->google2fa_secret : $this->google2faService->generateSecretKey(16);

        $sessionData = [
            'user_id' => $user->id,
            'secret' => $secret,
            'enrolled' => $isEnrolled,
            'attempts' => 0,
            'ip_address' => $context['ip_address'] ?? null,
            'user_agent' => $context['user_agent'] ?? null,
            'device' => $context['device'] ?? 'Desktop',
        ];

        Cache::put("auth_2fa_temp_{$tempToken}", $sessionData, now()->addMinutes(self::CHALLENGE_TTL_MINUTES));

        return $this->buildChallengeResponse($tempToken, $user->email, $secret, $isEnrolled);
    }

    /**
     * Verify a 6-digit TOTP code against the temporary session.
     */
    public function verify(string $tempToken, string $code): array
    {
        $cacheKey = "auth_2fa_temp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages(['code' => ['The 2FA verification session has expired or is invalid. Please sign in again.'],]);
        }

        $attempts = (int) ($data['attempts'] ?? 0) + 1;
        if ($attempts > self::MAX_OTP_ATTEMPTS) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages(['code' => ['Too many failed 2FA verification attempts. Please sign in again.'],]);
        }

        $secret = $data['secret'] ?? '';
        $isValid = (bool) $this->google2faService->verifyKey($secret, trim($code), 1);

        if (!$isValid) {
            $data['attempts'] = $attempts;
            Cache::put($cacheKey, $data, now()->addMinutes(self::CHALLENGE_TTL_MINUTES));

            throw ValidationException::withMessages(['code' => ['Invalid 2FA verification code. Please check your Google Authenticator app.'],]);
        }

        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            throw ValidationException::withMessages(['code' => ['User account not found.'],]);
        }

        if (empty($user->google2fa_secret) || !$user->google2fa_enabled) {
            $this->userRepository->update($user->id, ['google2fa_secret' => $secret, 'google2fa_enabled' => true,]);
        }

        Cache::forget($cacheKey);

        return $data;
    }

    /**
     * Retrieve active challenge data for an existing temporary session.
     */
    public function getChallenge(string $tempToken): ?array
    {
        $cacheKey = "auth_2fa_temp_{$tempToken}";
        $data = Cache::get($cacheKey);
        if (!$data) {
            return null;
        }

        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            return null;
        }

        return $this->buildChallengeResponse(
            $tempToken,
            $user->email,
            $data['secret'],
            (bool) ($data['enrolled'] ?? false)
        );
    }

    /**
     * Build standard 2FA challenge response payload.
     */
    protected function buildChallengeResponse(string $tempToken, string $email, string $secret, bool $isEnrolled): array
    {
        $response = [
            'step' => '2fa',
            'require_2fa' => true,
            'enrolled' => $isEnrolled,
            'temp_token' => $tempToken,
            'email' => $email,
        ];

        if (!$isEnrolled) {
            $company = config('app.name', 'TikTok Crawler CMS');
            $response['qr_code_url'] = $this->google2faService->getQRCodeUrl($company, $email, $secret);
            $response['secret_key'] = $secret;
        }

        return $response;
    }
}
