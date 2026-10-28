<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Crawler\Models\CrawlJob;
use Modules\System\Models\ActivityLog;
use Modules\System\Models\LoginLog;
use Modules\System\Services\ActivityLogger;
use Modules\TiktokAccount\Models\TiktokAccount;
use Tests\TestCase;

class SystemAuditAndDiagnosticTest extends TestCase
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
     * Test ActivityLogger records entries into database with all schema columns.
     */
    public function test_activity_logger_persists_log_entry(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        $log = ActivityLogger::log(
            action: 'UPDATE',
            module: 'TIKTOK',
            recordId: '@example_channel',
            recordType: 'TikTokChannel',
            oldData: ['channel_name' => 'Old Name', 'status' => 'ACTIVE'],
            newData: ['channel_name' => 'New Name', 'status' => 'ACTIVE'],
            metadata: ['ip' => '14.232.1.1', 'user_agent' => 'Mozilla/5.0'],
            status: 'SUCCESS',
            user: $admin
        );

        $this->assertNotNull($log);
        $this->assertDatabaseHas('activity_logs', [
            'id' => $log->id,
            'user_id' => $admin->id,
            'user_email' => 'admin@cms.com',
            'action' => 'UPDATE',
            'module' => 'TIKTOK',
            'record_id' => '@example_channel',
            'record_type' => 'TikTokChannel',
            'status' => 'SUCCESS',
        ]);

        $saved = ActivityLog::find($log->id);
        $this->assertEquals(['channel_name' => 'Old Name', 'status' => 'ACTIVE'], $saved->old_data);
        $this->assertEquals(['channel_name' => 'New Name', 'status' => 'ACTIVE'], $saved->new_data);
    }

    /**
     * Test ActivityOccurredEvent dispatched directly triggers listener and creates activity log.
     */
    public function test_activity_occurred_event_is_handled_by_queue_listener(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        \Modules\System\Events\ActivityOccurredEvent::dispatch(
            'ROLE_CHANGE',
            'USER_MANAGEMENT',
            (string) $admin->id,
            'User',
            ['roles' => ['Viewer']],
            ['roles' => ['Admin']],
            ['reason' => 'Promotion'],
            'SUCCESS',
            null,
            $admin
        );

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'ROLE_CHANGE',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $admin->id,
            'record_type' => 'User',
            'user_email' => 'admin@cms.com',
            'status' => 'SUCCESS',
        ]);
    }

    /**
     * Test authenticated user can retrieve login logs via System LoginLogController.
     */
    public function test_authenticated_user_can_retrieve_system_login_logs(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        LoginLog::create([
            'user_id' => $admin->id,
            'email' => $admin->email,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'device' => 'Desktop',
            'status' => 'success',
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
                    'ip_address',
                    'status',
                    'created_at',
                ],
            ],
            'meta' => [
                'total',
                'current_page',
            ],
        ]);
    }

    /**
     * Test authenticated user can retrieve activity logs via System ActivityLogController.
     */
    public function test_authenticated_user_can_retrieve_system_activity_logs(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        ActivityLogger::log(
            action: 'CREATE',
            module: 'USER_MANAGEMENT',
            recordId: (string) $admin->id,
            recordType: 'User',
            user: $admin
        );

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('system/activity-log'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                '*' => [
                    'id',
                    'user_email',
                    'action',
                    'module',
                    'status',
                    'created_at',
                ],
            ],
            'meta' => [
                'total',
            ],
        ]);
    }

    /**
     * Test retrieving system diagnostic information.
     */
    public function test_authenticated_user_can_retrieve_system_diagnostics(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('system/system-diagnostic'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'app_name',
                'php_version',
                'laravel_version',
                'database_driver',
                'database_connected',
                'server_os',
                'memory_usage_mb',
            ],
        ]);
        $this->assertEquals('success', $response->json('status'));
    }

    /**
     * Test Use Case 1: TikTok account creation and update logs activity.
     */
    public function test_tiktok_account_changes_trigger_activity_logs(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $this->actingAs($admin, 'sanctum');

        $account = TiktokAccount::create([
            'username' => 'sample_creator',
            'nickname' => 'Sample Creator',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'CREATE',
            'module' => 'TIKTOK',
            'record_type' => 'TikTokChannel',
            'record_id' => '@sample_creator',
        ]);

        $account->update(['nickname' => 'Updated Creator Name']);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'UPDATE',
            'module' => 'TIKTOK',
            'record_type' => 'TikTokChannel',
            'record_id' => '@sample_creator',
        ]);
    }

    /**
     * Test Use Case 2: Crawl retry triggers RETRY_CRAWL activity log.
     */
    public function test_crawl_job_start_and_retry_log_activity(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['status' => 'accepted'], 200),
        ]);

        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['@tiktok_user']),
            'total_accounts' => 1,
            'status' => 'failed',
            'retry_count' => 1,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson($this->apiUri("crawler/crawl-job/{$job->id}/retry"));

        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'RETRY_CRAWL',
            'module' => 'TIKTOK',
            'record_id' => "job_crawl_{$job->id}",
            'record_type' => 'CrawlJob',
        ]);
    }

    /**
     * Test CrawlJob failure dispatches CRAWL_FAILED activity log.
     */
    public function test_crawl_job_failure_dispatches_crawl_failed_activity_log(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['error' => 'Connection refused'], 500),
        ]);

        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['@tiktok_fail']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson($this->apiUri("crawler/crawl-job/{$job->id}/start"));

        $response->assertStatus(500);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'CRAWL_FAILED',
            'module' => 'TIKTOK',
            'record_id' => "job_crawl_{$job->id}",
            'record_type' => 'CrawlJob',
            'status' => 'FAILED',
        ]);
    }

    /**
     * Test Reset Password dispatches RESET_PASSWORD activity log on success and failure.
     */
    public function test_reset_password_dispatches_activity_log(): void
    {
        $user = User::where('email', 'admin@cms.com')->first();
        $token = \Illuminate\Support\Facades\Password::createToken($user);

        // 1. Success reset password
        $res = $this->postJson($this->apiUri('auth/reset-password'), [
            'email' => 'admin@cms.com',
            'token' => $token,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $res->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'RESET_PASSWORD',
            'module' => 'AUTH',
            'record_id' => (string) $user->id,
            'status' => 'SUCCESS',
        ]);

        // 2. Failed reset password (invalid token)
        $failRes = $this->postJson($this->apiUri('auth/reset-password'), [
            'email' => 'admin@cms.com',
            'token' => 'invalid-token-123',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $failRes->assertStatus(422);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'RESET_PASSWORD',
            'module' => 'AUTH',
            'record_id' => 'admin@cms.com',
            'status' => 'FAILED',
        ]);
    }

    /**
     * Test Admin requesting reset password email dispatches REQUEST_RESET_PASSWORD activity log.
     */
    public function test_send_mail_reset_password_dispatches_activity_log(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $target = User::where('email', 'manager@cms.com')->first();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson($this->apiUri("user/{$target->id}/reset-password"));

        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'REQUEST_RESET_PASSWORD',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $target->id,
            'status' => 'SUCCESS',
        ]);
    }

    /**
     * Test Activity Log statistics endpoint returns aggregate metrics via ActivityLogService.
     */
    public function test_activity_log_statistics_endpoint_returns_kpi_summary(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $token = $admin->createToken('admin_token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson($this->apiUri('system/activity-log/statistics'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'total_activities',
                'success_activities',
                'failed_activities',
                'today_activities',
            ],
        ]);
    }
}
