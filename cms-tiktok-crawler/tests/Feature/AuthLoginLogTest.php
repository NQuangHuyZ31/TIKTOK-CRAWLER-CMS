<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\System\Models\LoginLog;
use Database\Seeders\DatabaseSeeder;
use Tests\TestCase;

class AuthLoginLogTest extends TestCase
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
     * Test successful login logs an entry with status 'success'.
     */
    public function test_successful_login_creates_login_log(): void
    {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '192.168.1.100',
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        ])->postJson($this->apiUri('auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('login_logs', [
            'email' => 'admin@cms.com',
            'status' => 'success',
            'failure_reason' => null,
            'device' => 'Desktop',
            'ip_address' => '192.168.1.100',
        ]);
    }

    /**
     * Test invalid credentials login creates a failed login log.
     */
    public function test_failed_login_creates_failed_login_log(): void
    {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '10.0.0.50',
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        ])->postJson($this->apiUri('auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'wrong_password_123',
        ]);

        $response->assertStatus(401);

        $this->assertDatabaseHas('login_logs', [
            'email' => 'admin@cms.com',
            'status' => 'failed',
            'failure_reason' => 'invalid_credentials',
            'device' => 'Mobile',
            'ip_address' => '10.0.0.50',
        ]);
    }

    /**
     * Test blocked user login creates a blocked account login log.
     */
    public function test_blocked_user_login_creates_blocked_login_log(): void
    {
        $user = User::where('email', 'admin@cms.com')->first();
        $user->update(['status' => 'blocked']);

        $response = $this->postJson($this->apiUri('auth/login'), [
            'email' => 'admin@cms.com',
            'password' => 'password',
        ]);

        $response->assertStatus(401);

        $this->assertDatabaseHas('login_logs', [
            'user_id' => $user->id,
            'email' => 'admin@cms.com',
            'status' => 'failed',
            'failure_reason' => 'account_blocked',
        ]);
    }

    /**
     * Test authenticated user can retrieve paginated login logs via System API.
     */
    public function test_authenticated_user_can_retrieve_login_logs(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('log_token')->plainTextToken;

        // Seed some login logs
        LoginLog::create([
            'user_id' => $admin->id,
            'email' => $admin->email,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PostmanRuntime/7.32.3',
            'device' => 'Desktop',
            'status' => 'success',
        ]);

        LoginLog::create([
            'user_id' => $admin->id,
            'email' => $admin->email,
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0',
            'device' => 'Mobile',
            'status' => 'failed',
            'failure_reason' => 'invalid_credentials',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('system/login-log'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                '*' => [
                    'id',
                    'email',
                    'status',
                    'ip_address',
                    'device',
                    'created_at',
                ],
            ],
            'meta' => [
                'total',
                'current_page',
            ],
        ]);

        $this->assertGreaterThanOrEqual(2, $response->json('meta.total'));
    }

    /**
     * Test unauthenticated access to login logs is rejected with 401.
     */
    public function test_unauthenticated_access_to_login_logs_returns_401(): void
    {
        $response = $this->getJson($this->apiUri('system/login-log'));

        $response->assertStatus(401);
    }
}
