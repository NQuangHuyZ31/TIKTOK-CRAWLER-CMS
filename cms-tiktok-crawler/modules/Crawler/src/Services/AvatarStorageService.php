<?php

namespace Modules\Crawler\Services;

use InvalidArgumentException;

class AvatarStorageService
{
    public const MAX_AVATAR_BYTES = 2097152; // 2 MB

    protected const ALLOWED_MIME_EXTENSIONS = [
        'image/jpeg' => '.jpg',
        'image/png' => '.png',
        'image/webp' => '.webp',
        'image/gif' => '.gif',
    ];

    /**
     * Validate real binary MIME type and store decoded base64 avatar into public/tiktok-accounts/avatars/.
     *
     * @param string $username
     * @param array{content_base64?: string, mime?: string} $avatarPayload
     * @return string Relative path inside public directory (e.g. "tiktok-accounts/avatars/user.jpg")
     * @throws InvalidArgumentException If base64, size, or binary MIME signature is invalid.
     */
    public function storeFromBase64(string $username, array $avatarPayload): string
    {
        $encoded = (string) ($avatarPayload['content_base64'] ?? '');
        if ($encoded === '') {
            throw new InvalidArgumentException('Avatar content_base64 is empty.');
        }

        $binary = base64_decode($encoded, true);
        if ($binary === false || $binary === '') {
            throw new InvalidArgumentException('Avatar content_base64 is not valid base64.');
        }

        if (strlen($binary) > self::MAX_AVATAR_BYTES) {
            throw new InvalidArgumentException('Avatar file size exceeds maximum allowed limit (2MB).');
        }

        $realMime = $this->detectRealMimeType($binary);
        if (!$realMime || !isset(self::ALLOWED_MIME_EXTENSIONS[$realMime])) {
            throw new InvalidArgumentException('Unsupported or invalid image binary format.');
        }

        $extension = self::ALLOWED_MIME_EXTENSIONS[$realMime];
        $safeUsername = preg_replace('/[^A-Za-z0-9._-]/', '_', trim($username, '@ ')) ?: 'account';

        $relativeDir = 'tiktok-accounts/avatars';
        $targetDir = public_path($relativeDir);
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }

        $relativePath = "{$relativeDir}/{$safeUsername}{$extension}";
        file_put_contents(public_path($relativePath), $binary);

        return $relativePath;
    }

    protected function detectRealMimeType(string $binary): ?string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_buffer($finfo, $binary);
                finfo_close($finfo);
                if (is_string($mime) && $mime !== '') {
                    return strtolower(explode(';', $mime)[0]);
                }
            }
        }

        if (str_starts_with($binary, "\xFF\xD8\xFF")) {
            return 'image/jpeg';
        }
        if (str_starts_with($binary, "\x89PNG\r\n\x1a\n")) {
            return 'image/png';
        }
        if (str_starts_with($binary, "GIF87a") || str_starts_with($binary, "GIF89a")) {
            return 'image/gif';
        }
        if (strlen($binary) >= 12 && substr($binary, 0, 4) === 'RIFF' && substr($binary, 8, 4) === 'WEBP') {
            return 'image/webp';
        }

        return null;
    }
}
