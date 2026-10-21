<?php

namespace Modules\Core\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Utils\UploadFile;

class CoreController extends BaseController
{
    // public function ping(): JsonResponse
    // {
    //     return $this->respondSuccess([
    //         'app' => config('app.name'),
    //         'env' => config('app.env'),
    //         'admin_path' => config('admin.admin_path', 'admin'),
    //         'timestamp' => now()->toIso8601String(),
    //     ], 'Core service is healthy.');
    // }

    // public function upload(Request $request): JsonResponse
    // {
    //     $request->validate([
    //         'file' => 'required|file|max:10240',
    //         'folder' => 'nullable|string|max:100',
    //     ]);

    //     $file = $request->file('file');
    //     $folder = trim((string) $request->input('folder', 'uploads'), '/');
    //     $path = UploadFile::uploadFile($file, $folder);

    //     if (!$path) {
    //         return $this->respondError('Failed to upload file.', 500);
    //     }

    //     return $this->respondSuccess([
    //         'path' => $path,
    //         'url' => asset('storage/' . $path),
    //         'filename' => $file->getClientOriginalName(),
    //         'size' => $file->getSize(),
    //         'mime_type' => $file->getMimeType(),
    //     ], 'File uploaded successfully.', 201);
    // }

    // public function deleteUploadedFile(Request $request): JsonResponse
    // {
    //     $request->validate([
    //         'path' => 'required|string|max:255',
    //     ]);

    //     $path = $request->input('path');
    //     if (!UploadFile::deleteFile($path)) {
    //         return $this->respondError('File not found or could not be deleted.', 404);
    //     }

    //     return $this->respondSuccess(null, 'File deleted successfully.');
    // }
}
