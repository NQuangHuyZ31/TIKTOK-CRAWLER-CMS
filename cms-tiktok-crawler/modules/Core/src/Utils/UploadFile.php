<?php

namespace Modules\Core\Utils;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadFile {
    public static function uploadFile($file, $destinationPath, $filename = null, $deleteOldFile = false, $oldFilePath = null, $disk = 'public') {
        // File does not exist or is invalid
        if (!$file || !$file->isValid()) {
            return false;
        }

        // Delete old file if requested
        if ($deleteOldFile && $oldFilePath) {
            self::deleteFile($oldFilePath, $disk);
        }

        // Generate unique filename if not provided
        if (!$filename) {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        }

        // Upload and store file
        return $file->storeAs($destinationPath, $filename, $disk);
    }

    public static function deleteFile($filePath, $disk = 'public') {
        if (!$filePath) {
            return false;
        }

        $storage = Storage::disk($disk);

        if (!$storage->exists($filePath)) {
            return false;
        }

        return $storage->delete($filePath);
    }
}
