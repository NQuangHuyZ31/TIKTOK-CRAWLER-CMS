<?php

namespace Modules\Core\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

class StorageService
{
    public const DEFAULT_MAX_IMAGE_BYTES = 5242880; // 5 MB
    public const DEFAULT_MAX_FILE_BYTES = 52428800; // 50 MB

    protected const MIME_EXTENSIONS_MAP = [
        // Images
        'image/jpeg' => '.jpg',
        'image/png' => '.png',
        'image/webp' => '.webp',
        'image/gif' => '.gif',
        'image/svg+xml' => '.svg',
        // Videos
        'video/mp4' => '.mp4',
        'video/webm' => '.webm',
        'video/quicktime' => '.mov',
        // Audio
        'audio/mpeg' => '.mp3',
        'audio/wav' => '.wav',
        'audio/ogg' => '.ogg',
        // Documents / Data
        'application/pdf' => '.pdf',
        'application/json' => '.json',
        'text/csv' => '.csv',
        'text/plain' => '.txt',
        'application/zip' => '.zip',
    ];

    /**
     * Store a file from decoded base64 payload into the specified destination directory.
     *
     * @param string $base64Content Base64 encoded string (may include data URI prefix)
     * @param string $destinationDir Relative directory path (e.g. "tiktok-accounts/avatars" or "uploads/media")
     * @param string|null $filename Custom filename without extension or null for auto-generated UUID
     * @param array{
     *     disk?: string,
     *     max_bytes?: int,
     *     allowed_mimes?: array<string>,
     *     use_public_path?: bool
     * } $options Additional storage options
     * @return string Relative path of stored file (e.g. "tiktok-accounts/avatars/user.jpg")
     *
     * @throws InvalidArgumentException
     * @throws RuntimeException
     */
    public function storeFromBase64(
        string $base64Content,
        string $destinationDir,
        ?string $filename = null,
        array $options = []
    ): string {
        $encoded = trim($base64Content);
        if ($encoded === '') {
            throw new InvalidArgumentException('Base64 content cannot be empty.');
        }

        // Strip data URI scheme prefix if present (e.g., "data:image/png;base64,...")
        if (str_contains($encoded, ';base64,')) {
            $parts = explode(';base64,', $encoded);
            $encoded = end($parts);
        }

        $binary = base64_decode($encoded, true);
        if ($binary === false || $binary === '') {
            throw new InvalidArgumentException('Provided content is not valid base64 data.');
        }

        $maxBytes = $options['max_bytes'] ?? self::DEFAULT_MAX_FILE_BYTES;
        if (strlen($binary) > $maxBytes) {
            $maxMb = round($maxBytes / 1048576, 1);
            throw new InvalidArgumentException("File size exceeds maximum allowed limit ({$maxMb}MB).");
        }

        $realMime = $this->detectRealMimeType($binary);
        $allowedMimes = $options['allowed_mimes'] ?? null;

        if ($allowedMimes !== null && is_array($allowedMimes) && !empty($allowedMimes)) {
            if (!$realMime || !in_array($realMime, $allowedMimes, true)) {
                throw new InvalidArgumentException("Unsupported file type: {$realMime}.");
            }
        }

        $extension = $this->resolveExtension($realMime);
        $safeName = $filename ? $this->sanitizeFilename($filename) : Str::uuid()->toString();
        $cleanDir = trim($destinationDir, '/\\');
        $relativePath = "{$cleanDir}/{$safeName}{$extension}";
        $disk = $options['disk'] ?? 'public';
        $usePublicPath = $options['use_public_path'] ?? ($disk === 'public');

        $this->persistBinary($relativePath, $binary, $disk, $usePublicPath);

        return $relativePath;
    }

    /**
     * Store an uploaded HTTP file.
     *
     * @param UploadedFile $file
     * @param string $destinationDir
     * @param string|null $filename
     * @param array{disk?: string, delete_old?: bool, old_path?: string|null} $options
     * @return string Stored relative path
     */
    public function storeUploadedFile(
        UploadedFile $file,
        string $destinationDir,
        ?string $filename = null,
        array $options = []
    ): string {
        if (!$file->isValid()) {
            throw new InvalidArgumentException('Uploaded file is invalid or corrupt.');
        }

        $disk = $options['disk'] ?? 'public';

        if (!empty($options['delete_old']) && !empty($options['old_path'])) {
            $this->delete($options['old_path'], $disk);
        }

        $cleanDir = trim($destinationDir, '/\\');
        $ext = '.' . ltrim($file->getClientOriginalExtension(), '.');
        $safeName = $filename ? $this->sanitizeFilename($filename) . $ext : $file->hashName();

        $path = $file->storeAs($cleanDir, $safeName, $disk);
        if (!$path) {
            throw new RuntimeException("Failed to store uploaded file into {$cleanDir}.");
        }

        return $path;
    }

    /**
     * Store raw binary data.
     */
    public function storeBinary(
        string $binaryData,
        string $destinationDir,
        string $filename,
        string $disk = 'public',
        bool $usePublicPath = true
    ): string {
        $cleanDir = trim($destinationDir, '/\\');
        $safeName = $this->sanitizeFilename($filename);
        $relativePath = "{$cleanDir}/{$safeName}";

        $this->persistBinary($relativePath, $binaryData, $disk, $usePublicPath);

        return $relativePath;
    }

    /**
     * Store user avatar from base64 payload (convenience helper).
     *
     * @param string $username Account username for avatar naming
     * @param array{content_base64?: string, mime?: string} $avatarPayload Base64 avatar payload
     * @return string Relative path (e.g. "tiktok-accounts/avatars/{username}.jpg")
     */
    public function storeAvatar(string $username, array $avatarPayload): string
    {
        $encoded = (string) ($avatarPayload['content_base64'] ?? '');
        if ($encoded === '') {
            throw new InvalidArgumentException('Avatar content_base64 is empty.');
        }

        $safeUsername = $this->sanitizeFilename(ltrim($username, '@ '));
        if ($safeUsername === '') {
            $safeUsername = 'account';
        }

        return $this->storeFromBase64(
            base64Content: $encoded,
            destinationDir: 'tiktok-accounts/avatars',
            filename: $safeUsername,
            options: [
                'disk' => 'public',
                'max_bytes' => 2097152, // 2MB limit for avatars
                'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                'use_public_path' => true,
            ]
        );
    }

    /**
     * Delete a stored file by relative path.
     */
    public function delete(string $filePath, string $disk = 'public'): bool
    {
        $cleanPath = trim($filePath, '/\\');
        if ($cleanPath === '') {
            return false;
        }

        $deleted = false;

        // Try deleting from public_path directly if on public disk
        if ($disk === 'public') {
            $fullPublicPath = public_path($cleanPath);
            if (file_exists($fullPublicPath) && is_file($fullPublicPath)) {
                $deleted = @unlink($fullPublicPath);
            }
        }

        $storage = Storage::disk($disk);
        if ($storage->exists($cleanPath)) {
            $deleted = $storage->delete($cleanPath) || $deleted;
        }

        return $deleted;
    }

    /**
     * Check if a stored file exists.
     */
    public function exists(string $filePath, string $disk = 'public'): bool
    {
        $cleanPath = trim($filePath, '/\\');
        if ($cleanPath === '') {
            return false;
        }

        if ($disk === 'public' && file_exists(public_path($cleanPath))) {
            return true;
        }

        return Storage::disk($disk)->exists($cleanPath);
    }

    /**
     * Resolve publicly accessible URL for a stored asset path.
     */
    public function getUrl(string $filePath, string $disk = 'public'): string
    {
        $cleanPath = ltrim(trim($filePath), '/\\');

        if ($disk === 'public') {
            return asset($cleanPath);
        }

        return Storage::disk($disk)->url($cleanPath);
    }

    /**
     * Low-level binary persistence with fallback support.
     */
    protected function persistBinary(string $relativePath, string $binary, string $disk, bool $usePublicPath): void
    {
        $written = false;

        if ($usePublicPath && $disk === 'public') {
            $fullPath = public_path($relativePath);
            $targetDir = dirname($fullPath);

            if (!is_dir($targetDir)) {
                @mkdir($targetDir, 0775, true);
            }

            if (is_dir($targetDir) && is_writable($targetDir)) {
                $written = @file_put_contents($fullPath, $binary) !== false;
            }
        }

        if (!$written) {
            $written = Storage::disk($disk)->put($relativePath, $binary);
        }

        if (!$written) {
            throw new RuntimeException("Unable to write file to {$relativePath} on disk {$disk}.");
        }
    }

    /**
     * Inspect file binary headers to detect accurate MIME type.
     */
    public function detectRealMimeType(string $binary): ?string
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

        // Magic bytes fallback checks
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
        if (strlen($binary) >= 8 && substr($binary, 4, 4) === 'ftyp') {
            return 'video/mp4';
        }
        if (str_starts_with($binary, "\x1A\x45\xDF\xA3")) {
            return 'video/webm';
        }
        if (str_starts_with($binary, "%PDF-")) {
            return 'application/pdf';
        }

        return null;
    }

    /**
     * Map MIME type to standard extension.
     */
    public function resolveExtension(?string $mime): string
    {
        if ($mime && isset(self::MIME_EXTENSIONS_MAP[$mime])) {
            return self::MIME_EXTENSIONS_MAP[$mime];
        }

        return '.bin';
    }

    /**
     * Sanitize user input for safe filename generation.
     */
    public function sanitizeFilename(string $name): string
    {
        $clean = preg_replace('/[^A-Za-z0-9._-]/', '_', trim($name));
        return trim($clean, '._-') ?: 'file';
    }
}
