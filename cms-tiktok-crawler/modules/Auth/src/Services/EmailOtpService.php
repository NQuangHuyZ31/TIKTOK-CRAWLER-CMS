<?php

namespace Modules\Auth\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Jobs\SendLoginOtpNotification;
use Modules\Auth\Services\Interfaces\EmailOtpServiceInterface;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class EmailOtpService implements EmailOtpServiceInterface
{
    public const MAX_ATTEMPTS = 5;
    public const DEFAULT_TTL_MINUTES = 5;

    public function __construct(
        protected UserRepositoryInterface $userRepository
    ) {}

    public function isEnabled(): bool
    {
        $enabled = config('auth.email_otp.enabled');
        if ($enabled !== null) {
            return filter_var($enabled, FILTER_VALIDATE_BOOLEAN);
        }

        return filter_var(env('AUTH_EMAIL_OTP_ENABLED', false), FILTER_VALIDATE_BOOLEAN);
    }

    public function sendOtp(User $user, array $context = []): array
    {
        $otp = sprintf('%06d', random_int(100000, 999999));
        $tempToken = Str::random(64);
        $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_TTL_MINUTES);

        $sessionData = [
            'user_id' => $user->id,
            'otp' => $otp,
            'email' => $user->email,
            'attempts' => 0,
            'ip_address' => $context['ip_address'] ?? null,
            'user_agent' => $context['user_agent'] ?? null,
            'device' => $context['device'] ?? 'Desktop',
        ];

        Cache::put("auth_email_otp_{$tempToken}", $sessionData, now()->addMinutes($ttlMinutes));

        // Dispatch queued email job (identical to PasswordResetNotification pattern)
        SendLoginOtpNotification::dispatch($user->email, $otp, $user->name);

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A 6-digit verification code has been sent to your email address.',
        ];
    }

    public function verifyOtp(string $tempToken, string $code): array
    {
        $cacheKey = "auth_email_otp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired or is invalid. Please sign in again.'],
            ]);
        }

        $attempts = (int) ($data['attempts'] ?? 0) + 1;
        if ($attempts > self::MAX_ATTEMPTS) {
            Cache::forget($cacheKey);
            throw ValidationException::withMessages([
                'code' => ['Too many failed verification attempts. Please sign in again.'],
            ]);
        }

        if (trim($code) !== (string) $data['otp']) {
            $data['attempts'] = $attempts;
            $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_TTL_MINUTES);
            Cache::put($cacheKey, $data, now()->addMinutes($ttlMinutes));

            throw ValidationException::withMessages([
                'code' => ['Invalid verification code. Please check your email.'],
            ]);
        }

        // Invalidate cache immediately on successful verification (anti-replay)
        Cache::forget($cacheKey);

        return $data;
    }

    public function resendOtp(string $tempToken): array
    {
        $cacheKey = "auth_email_otp_{$tempToken}";
        $data = Cache::get($cacheKey);

        if (!$data) {
            throw ValidationException::withMessages([
                'code' => ['The verification session has expired. Please sign in again.'],
            ]);
        }
        
        $user = $this->userRepository->findById($data['user_id']);
        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['User account not found.'],
            ]);
        }

        $otp = sprintf('%06d', random_int(100000, 999999));
        $data['otp'] = $otp;
        $data['attempts'] = 0;
        $ttlMinutes = (int) config('auth.email_otp.ttl_minutes', self::DEFAULT_TTL_MINUTES);

        Cache::put($cacheKey, $data, now()->addMinutes($ttlMinutes));

        SendLoginOtpNotification::dispatch($user->email, $otp, $user->name);

        return [
            'step' => 'email_otp',
            'require_otp' => true,
            'temp_token' => $tempToken,
            'email' => $this->maskEmail($user->email),
            'message' => 'A new verification code has been sent to your email address.',
        ];
    }

    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $name = $parts[0];
        $domain = $parts[1];
        $len = strlen($name);

        if ($len <= 2) {
            $maskedName = substr($name, 0, 1) . '*';
        } else {
            $maskedName = substr($name, 0, 2) . str_repeat('*', max(1, $len - 3)) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }
}
