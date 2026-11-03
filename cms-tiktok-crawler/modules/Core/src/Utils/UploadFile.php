<?php

namespace Modules\Core\Utils;

use Illuminate\Http\UploadedFile;
use Modules\Core\Services\StorageService;

/**
 * @deprecated Use Modules\Core\Services\StorageService instead.
 * Retained strictly for backward compatibility with legacy callers.
 */
class UploadFile
{
    /**
     * @deprecated Use StorageService::storeUploadedFile() instead.
     */
    public static function uploadFile(
        mixed $file,
        string $destinationPath,
        ?string $filename = null,
        bool $deleteOldFile = false,
        ?string $oldFilePath = null,
        string $disk = 'public'
    ): string|false {
        if (!$file instanceof UploadedFile || !$file->isValid()) {
            return false;
        }

        try {
            /** @var StorageService $storageService */
            $storageService = app(StorageService::class);

            return $storageService->storeUploadedFile(
                file: $file,
                destinationDir: $destinationPath,
                filename: $filename ? pathinfo($filename, PATHINFO_FILENAME) : null,
                options: [
                    'disk' => $disk,
                    'delete_old' => $deleteOldFile,
                    'old_path' => $oldFilePath,
                ]
            );
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @deprecated Use StorageService::delete() instead.
     */
    public static function deleteFile(?string $filePath, string $disk = 'public'): bool
    {
        if (!$filePath) {
            return false;
        }

        /** @var StorageService $storageService */
        $storageService = app(StorageService::class);

        return $storageService->delete($filePath, $disk);
    }
}
