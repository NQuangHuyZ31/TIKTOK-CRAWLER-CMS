<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Modules\System\Jobs\PruneExpiredLogsJob;
use Modules\System\Models\ActivityLog;
use Modules\System\Models\LoginLog;
use Modules\System\Services\SystemSettingService;
use Modules\User\Models\User;
use Tests\TestCase;

class SystemSettingTest extends TestCase
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
     * Test getting worker settings via API.
     */
    public function test_system_settings_index_endpoint_returns_worker_settings(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson($this->apiUri('system/system-setting?group=worker'));

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonStructure([
            'data' => [
                'group',
                'settings' => [
                    'auto_cleanup_enabled',
                    'cleanup_schedule_cron',
                    'activity_log_retention_days',
                    'login_log_retention_days',
                    'cleanup_chunk_size',
                ],
            ],
        ]);
    }

    /**
     * Test updating worker settings via API.
     */
    public function test_system_settings_update_endpoint_persists_new_configuration(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        $payload = [
            'group' => 'worker',
            'settings' => [
                'auto_cleanup_enabled' => false,
                'cleanup_schedule_preset' => 'daily_00_00',
                'cleanup_schedule_cron' => '0 0 * * *',
                'activity_log_retention_days' => 45,
                'login_log_retention_days' => 90,
                'cleanup_chunk_size' => 1000,
            ],
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/update-settings'), $payload);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.settings.auto_cleanup_enabled', false);
        $response->assertJsonPath('data.settings.activity_log_retention_days', 45);
        $response->assertJsonPath('data.settings.login_log_retention_days', 90);
        $response->assertJsonPath('data.settings.cleanup_chunk_size', 1000);
    }

    /**
     * Test safety floor validation on retention days.
     */
    public function test_system_settings_retention_days_enforces_safety_floor(): void
    {
        $service = app(SystemSettingService::class);

        // Attempting to set retention days below minimum floors (7 for activity, 14 for login)
        $service->updateGroupSettings('worker', [
            'activity_log_retention_days' => 2,
            'login_log_retention_days' => 5,
        ]);

        $settings = $service->getGroupSettings('worker');

        $this->assertEquals(7, $settings['activity_log_retention_days']);
        $this->assertEquals(14, $settings['login_log_retention_days']);
    }

    /**
     * Test dynamic cron evaluation in shouldRunCleanupNow.
     */
    public function test_should_run_cleanup_now_evaluates_cron_expression(): void
    {
        $service = app(SystemSettingService::class);

        // Fix current time to 2026-10-28 02:00:00
        Carbon::setTestNow(Carbon::parse('2026-10-28 02:00:00'));

        $service->updateGroupSettings('worker', [
            'auto_cleanup_enabled' => true,
            'cleanup_schedule_cron' => '0 2 * * *',
        ]);

        $this->assertTrue($service->shouldRunCleanupNow());

        // Change time to 02:01:00 -> should not run
        Carbon::setTestNow(Carbon::parse('2026-10-28 02:01:00'));
        $this->assertFalse($service->shouldRunCleanupNow());

        // Reset test time
        Carbon::setTestNow();
    }

    /**
     * Test chunked pruning deletes only expired logs and preserves active ones.
     */
    public function test_execute_chunked_prune_purges_expired_logs_and_keeps_recent_logs(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        // 1. Create expired logs (> 30 days old)
        ActivityLog::insert([
            'user_id' => $admin->id,
            'user_email' => $admin->email,
            'action' => 'DELETE',
            'module' => 'TEST',
            'status' => 'SUCCESS',
            'created_at' => now()->subDays(40),
        ]);

        LoginLog::insert([
            'user_id' => $admin->id,
            'email' => $admin->email,
            'ip_address' => '127.0.0.1',
            'status' => 'SUCCESS',
            'created_at' => now()->subDays(70),
        ]);

        // 2. Create fresh logs (5 days old)
        ActivityLog::insert([
            'user_id' => $admin->id,
            'user_email' => $admin->email,
            'action' => 'CREATE',
            'module' => 'TEST',
            'status' => 'SUCCESS',
            'created_at' => now()->subDays(5),
        ]);

        LoginLog::insert([
            'user_id' => $admin->id,
            'email' => $admin->email,
            'ip_address' => '127.0.0.1',
            'status' => 'SUCCESS',
            'created_at' => now()->subDays(5),
        ]);

        $service = app(SystemSettingService::class);
        $result = $service->executeChunkedPrune([
            'activity_days' => 30,
            'login_days' => 60,
            'chunk_size' => 10,
            'sleep_ms' => 0,
        ]);

        $this->assertEquals(1, $result['activity_logs_purged']);
        $this->assertEquals(1, $result['login_logs_purged']);
        $this->assertEquals(2, $result['total_purged']);

        // Verify recent logs still exist
        $this->assertEquals(1, ActivityLog::where('module', 'TEST')->count());
        $this->assertEquals(1, LoginLog::where('created_at', '>=', now()->subDays(10))->count());
    }

    /**
     * Test on-demand manual cleanup endpoint.
     */
    public function test_run_cleanup_endpoint_executes_on_demand_prune(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/run-cleanup'), [
                'activity_days' => 30,
                'login_days' => 60,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonStructure([
            'data' => [
                'activity_logs_purged',
                'login_logs_purged',
                'total_purged',
                'duration_sec',
            ],
        ]);
    }

    /**
     * Test artisan console command system:prune-logs.
     */
    public function test_artisan_prune_command_executes_successfully(): void
    {
        $this->artisan('system:prune-logs --chunk=100')
            ->assertSuccessful();
    }

    /**
     * Test artisan command with --queue flag dispatches PruneExpiredLogsJob.
     */
    public function test_artisan_prune_command_with_queue_dispatches_job(): void
    {
        Queue::fake();

        $this->artisan('system:prune-logs --queue')
            ->assertSuccessful();

        Queue::assertPushed(PruneExpiredLogsJob::class);
    }

    /**
     * Test async on-demand cleanup dispatches PruneExpiredLogsJob.
     */
    public function test_run_cleanup_async_endpoint_dispatches_job(): void
    {
        Queue::fake();
        $admin = User::where('email', 'admin@cms.com')->first();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson($this->apiUri('system/system-setting/run-cleanup'), [
                'async' => true,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.dispatched', true);

        Queue::assertPushed(PruneExpiredLogsJob::class);
    }

    /**
     * Test PruneExpiredLogsJob handle execution directly.
     */
    public function test_prune_expired_logs_job_handles_execution(): void
    {
        $job = new PruneExpiredLogsJob(['trigger' => 'test_worker']);
        $job->handle(app(SystemSettingService::class));

        $this->assertEquals('success', app(SystemSettingService::class)->getSetting('last_cleanup_status'));
    }
}
