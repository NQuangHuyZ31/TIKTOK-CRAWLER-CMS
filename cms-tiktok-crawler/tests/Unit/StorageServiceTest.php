<?php

namespace Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Modules\Core\Services\StorageService;
use Tests\TestCase;

class StorageServiceTest extends TestCase
{
    protected StorageService $storageService;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->storageService = new StorageService();
    }

    public function test_store_from_base64_stores_valid_image(): void
    {
        // 1x1 transparent PNG
        $base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $storedPath = $this->storageService->storeFromBase64(
            base64Content: $base64Png,
            destinationDir: 'test-uploads',
            filename: 'test_image',
            options: [
                'disk' => 'public',
                'allowed_mimes' => ['image/png', 'image/jpeg'],
                'use_public_path' => false,
            ]
        );

        $this->assertSame('test-uploads/test_image.png', $storedPath);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_store_from_base64_strips_data_uri_prefix(): void
    {
        $base64WithPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $storedPath = $this->storageService->storeFromBase64(
            base64Content: $base64WithPrefix,
            destinationDir: 'test-uploads',
            filename: 'prefix_test',
            options: ['disk' => 'public', 'use_public_path' => false]
        );

        $this->assertSame('test-uploads/prefix_test.png', $storedPath);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_store_from_base64_rejects_disallowed_mime(): void
    {
        $this->expectException(InvalidArgumentException::class);

        // Raw text instead of image
        $base64Text = base64_encode('plain text content');

        $this->storageService->storeFromBase64(
            base64Content: $base64Text,
            destinationDir: 'test-uploads',
            filename: 'disallowed',
            options: [
                'disk' => 'public',
                'allowed_mimes' => ['image/png', 'image/jpeg'],
                'use_public_path' => false,
            ]
        );
    }

    public function test_store_uploaded_file(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $storedPath = $this->storageService->storeUploadedFile(
            file: $file,
            destinationDir: 'avatars',
            filename: 'my_avatar',
            options: ['disk' => 'public']
        );

        $this->assertSame('avatars/my_avatar.jpg', $storedPath);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_store_binary_and_delete(): void
    {
        $binary = 'hello binary storage';
        $storedPath = $this->storageService->storeBinary(
            binaryData: $binary,
            destinationDir: 'binary-files',
            filename: 'data.txt',
            disk: 'public',
            usePublicPath: false
        );

        $this->assertSame('binary-files/data.txt', $storedPath);
        Storage::disk('public')->assertExists($storedPath);

        $deleted = $this->storageService->delete($storedPath, 'public');
        $this->assertTrue($deleted);
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_store_avatar_helper(): void
    {
        $base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $storedPath = $this->storageService->storeAvatar(
            username: '@cool_creator',
            avatarPayload: ['content_base64' => $base64Png]
        );

        $this->assertSame('tiktok-accounts/avatars/cool_creator.png', $storedPath);
        @unlink(public_path($storedPath));
    }
}
