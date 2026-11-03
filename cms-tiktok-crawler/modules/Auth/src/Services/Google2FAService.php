<?php

namespace Modules\Auth\Services;

class Google2FAService
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a new cryptographically secure Base32 secret key.
     */
    public function generateSecretKey(int $length = 16): string
    {
        $secret = '';
        $max = strlen(self::BASE32_CHARS) - 1;

        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_CHARS[random_int(0, $max)];
        }

        return $secret;
    }

    /**
     * Generate standard otpauth URL for Google Authenticator QR Code.
     */
    public function getQRCodeUrl(string $company, string $holder, string $secret): string
    {
        $companyEncoded = rawurlencode($company);
        $holderEncoded = rawurlencode($holder);

        return "otpauth://totp/{$companyEncoded}:{$holderEncoded}?secret={$secret}&issuer={$companyEncoded}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Verify a 6-digit TOTP key against the secret (supports time drift window).
     */
    public function verifyKey(string $secret, string $key, int $window = 1): bool
    {
        $key = trim($key);
        if (strlen($key) !== 6 || !ctype_digit($key)) {
            return false;
        }

        $secretBinary = $this->base32Decode($secret);
        if ($secretBinary === false) {
            return false;
        }

        $currentTimeSlice = (int) floor(time() / 30);

        for ($i = -$window; $i <= $window; $i++) {
            $calculatedCode = $this->calculateCode($secretBinary, $currentTimeSlice + $i);
            if (hash_equals($calculatedCode, $key)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate 6-digit TOTP code for a specific time slice.
     */
    public function calculateCode(string $secretBinary, int $timeSlice): string
    {
        $timeBytes = pack('N*', 0) . pack('N*', $timeSlice);
        $hmac = hash_hmac('sha1', $timeBytes, $secretBinary, true);

        $offset = ord(substr($hmac, -1)) & 0x0F;
        $unpacked = unpack('N', substr($hmac, $offset, 4));
        $value = ($unpacked[1] ?? 0) & 0x7FFFFFFF;

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Decode a Base32 string into binary bytes.
     */
    private function base32Decode(string $b32): string|false
    {
        $b32 = strtoupper(trim($b32));
        if ($b32 === '') {
            return '';
        }

        $buffer = 0;
        $bufferBits = 0;
        $binary = '';

        for ($i = 0, $len = strlen($b32); $i < $len; $i++) {
            $char = $b32[$i];
            if ($char === '=') {
                break;
            }

            $pos = strpos(self::BASE32_CHARS, $char);
            if ($pos === false) {
                return false;
            }

            $buffer = ($buffer << 5) | $pos;
            $bufferBits += 5;

            if ($bufferBits >= 8) {
                $bufferBits -= 8;
                $binary .= chr(($buffer >> $bufferBits) & 0xFF);
            }
        }

        return $binary;
    }
}
