<?php

namespace Modules\Crawler\Services;

use Modules\Core\Services\StorageService;

/**
 * AvatarStorageService
 *
 * @deprecated Use Modules\Core\Services\StorageService instead.
 * Retained as a subclass of StorageService for backward compatibility with existing tests and callers.
 */
class AvatarStorageService extends StorageService
{
    public const MAX_AVATAR_BYTES = 2097152; // 2 MB

    /**
     * Store avatar from base64 payload.
     * Delegates to the shared StorageService storeAvatar implementation.
     *
     * @param string $username
     * @param array{content_base64?: string, mime?: string} $avatarPayload
     * @return string
     */
    public function storeFromBase64(string $username, array $avatarPayload): string
    {
        return $this->storeAvatar($username, $avatarPayload);
    }
}
