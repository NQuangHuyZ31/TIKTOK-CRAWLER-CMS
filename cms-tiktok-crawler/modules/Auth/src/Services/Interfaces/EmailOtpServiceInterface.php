<?php

namespace Modules\Auth\Services\Interfaces;

use Modules\User\Models\User;

interface EmailOtpServiceInterface
{
    /**
     * Check if email OTP authentication is globally enabled in config / env.
     */
    public function isEnabled(): bool;

    /**
     * Generate 6-digit OTP, send email, and return temporary session payload.
     */
    public function sendOtp(User $user, array $context = []): array;

    /**
     * Verify 6-digit OTP code against active temporary session.
     */
    public function verifyOtp(string $tempToken, string $code): array;

    /**
     * Resend fresh OTP code to user's email.
     */
    public function resendOtp(string $tempToken): array;
}
