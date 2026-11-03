<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

class AuthFeatureExtendedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    /**
     * Test API: POST /{admin_path}/api/auth/forgot-password & reset-password
     */
    // public function test_forgot_and_reset_password_flow(): void
    // {
    //     // 1. Request forgot password
    //     $forgotResponse = $this->postJson($this->apiUri('auth/forgot-password'), [
    //         'email' => 'admin@cms.com',
    //     ]);

    //     $forgotResponse->assertStatus(200);

    //     // 2. Reset password using token
    //     $resetResponse = $this->postJson($this->apiUri('auth/reset-password'), [
    //         'email' => 'admin@cms.com',
    //         'token' => '123456',
    //         'password' => 'new_password123',
    //         'password_confirmation' => 'new_password123',
    //     ]);

    //     $resetResponse->assertStatus(200);
    //     $resetResponse->assertJsonPath('status', 'success');

    //     // 3. Login with new password
    //     $loginResponse = $this->postJson($this->apiUri('auth/login'), [
    //         'email' => 'admin@cms.com',
    //         'password' => 'new_password123',
    //     ]);

    //     $loginResponse->assertStatus(200);
    //     $this->assertNotEmpty($loginResponse->json('data.token'));
    // }

    /**
     * Test API: GET /{admin_path}/api/auth/me returns complete profile, roles, and permissions matrix
     */
    public function test_auth_me_returns_complete_permissions_and_roles(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('role_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('auth/me'));

        $response->assertStatus(200);
        $response->assertJsonPath('data.email', 'admin@cms.com');
        $this->assertNotEmpty($response->json('data.roles'));
        $this->assertNotEmpty($response->json('data.permissions'));
        $this->assertTrue($response->json('data.module_permissions.crawler.view'));
        $this->assertTrue($response->json('data.module_permissions.crawler.edit'));
    }
}
