<?php

namespace Modules\Auth\Services\Interfaces;

use Modules\User\Models\User;

interface TwoFactorServiceInterface
{
    /**
     * Check if 2FA authentication is globally enabled in environment/config.
     */
    public function isEnabled(): bool;

    /**
     * Initiate a temporary 2FA challenge session for the user and return QR code data.
     */
    public function initiateSession(User $user, array $context = []): array;

    /**
     * Verify a 6-digit TOTP code against the temporary session.
     */
    public function verify(string $tempToken, string $code): array;

    /**
     * Retrieve active challenge data for an existing temporary session.
     */
    public function getChallenge(string $tempToken): ?array;
}
