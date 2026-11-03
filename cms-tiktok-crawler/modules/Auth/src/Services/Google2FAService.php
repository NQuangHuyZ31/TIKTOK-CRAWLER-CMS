<?php

namespace Modules\Auth\Services;

use PragmaRX\Google2FA\Google2FA;

class Google2FAService
{
    protected Google2FA $google2fa;

    public function __construct(?Google2FA $google2fa = null)
    {
        $this->google2fa = $google2fa ?? new Google2FA();
    }

    /**
     * Generate a new cryptographically secure Base32 secret key using PragmaRX Google2FA.
     */
    public function generateSecretKey(int $length = 16): string
    {
        return $this->google2fa->generateSecretKey($length);
    }

    /**
     * Generate standard otpauth URL for Google Authenticator QR Code.
     */
    public function getQRCodeUrl(string $company, string $holder, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl($company, $holder, $secret);
    }

    /**
     * Verify a 6-digit TOTP key against the secret (supports time drift window).
     */
    public function verifyKey(string $secret, string $key, int $window = 1): bool
    {
        return (bool) $this->google2fa->verifyKey($secret, $key, $window);
    }

    /**
     * Calculate 6-digit TOTP code for a specific timestamp / slice (used by tests and verification).
     */
    public function calculateCode(string $secret, ?int $timestamp = null): string
    {
        return $this->google2fa->getCurrentOtp($secret);
    }
}
