<?php

namespace Modules\Core\Utils;

use Illuminate\Http\UploadedFile;

class CheckFileUpload
{
    /**
     * Allowed image extensions, including modern webp.
     */
    private static array $allowedImageExtensions = ['jpeg', 'png', 'jpg', 'gif', 'webp'];

    /**
     * Allowed file extensions.
     */
    private static array $allowedFileExtensions = ['csv', 'xlsx'];

    /**
     * Maximum image size in kilobytes (2048 KB = 2 MB).
     */
    private static int $maxImageSize = 2048;

    /**
     * Validate whether an uploaded file is a valid image within size and format constraints.
     */
    public static function checkImageFile(mixed $file): bool
    {
        if (!$file instanceof UploadedFile || !$file->isValid()) {
            return false;
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $sizeInKb = $file->getSize() / 1024;

        if (!in_array($extension, self::$allowedImageExtensions, true)) {
            return false;
        }

        if ($sizeInKb > self::$maxImageSize) {
            return false;
        }

        return true;
    }

    /**
     * Get allowed image extensions list.
     *
     * @return array<string>
     */
    public static function getAllowedImageExtensions(): array
    {
        return self::$allowedImageExtensions;
    }
}
