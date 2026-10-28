<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Role\Models\Role;
use Modules\System\Contracts\AuditableEvent;
use Modules\System\Facades\Audit;
use Modules\System\Models\ActivityLog;
use Modules\User\Models\User;
use Tests\TestCase;

class TestCustomAuditableEvent implements AuditableEvent
{
    public function __construct(
        public string $channelName,
        public int $followerCount
    ) {}

    public function toActivityLog(): array
    {
        return [
            'action' => 'SYNC_METRICS',
            'module' => 'TIKTOK',
            'record_id' => '@' . $this->channelName,
            'record_type' => 'TikTokChannel',
            'metadata' => [
                'followers' => $this->followerCount,
            ],
            'status' => 'SUCCESS',
        ];
    }
}

class AuditorPipelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Test Audit::record with an Eloquent model automatically resolves context.
     */
    public function test_audit_record_auto_resolves_model_context(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $this->actingAs($admin);

        Audit::record(
            action: 'VERIFY_ACCOUNT',
            target: $admin,
            metadata: ['method' => '2fa']
        );

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'VERIFY_ACCOUNT',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $admin->id,
            'record_type' => 'User',
            'user_email' => 'admin@cms.com',
            'status' => 'SUCCESS',
        ]);
    }

    /**
     * Test Audit::track successfully executes callback, returns result, and audits SUCCESS.
     */
    public function test_audit_track_handles_successful_execution(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $this->actingAs($admin);

        $result = Audit::track(
            action: 'CALCULATE_KPI',
            target: $admin,
            execute: function () {
                return 42 * 2;
            },
            metadata: ['period' => 'Q3']
        );

        $this->assertEquals(84, $result);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'CALCULATE_KPI',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $admin->id,
            'status' => 'SUCCESS',
        ]);
    }

    /**
     * Test Audit::track catches exception, records FAILED log with error message, and rethrows.
     */
    public function test_audit_track_handles_failed_execution_and_rethrows(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $this->actingAs($admin);

        $caught = false;
        try {
            Audit::track(
                action: 'EXPORT_REPORT',
                target: $admin,
                execute: function () {
                    throw new \RuntimeException('Export storage disk full.');
                },
                metadata: ['report_type' => 'finance']
            );
        } catch (\RuntimeException $e) {
            $caught = true;
            $this->assertEquals('Export storage disk full.', $e->getMessage());
        }

        $this->assertTrue($caught, 'Exception was not re-thrown by Audit::track');

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'EXPORT_REPORT',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $admin->id,
            'status' => 'FAILED',
            'error_message' => 'Export storage disk full.',
        ]);
    }

    /**
     * Test domain event implementing AuditableEvent is processed and persisted by listener.
     */
    public function test_auditable_domain_event_is_handled_by_listener(): void
    {
        $admin = User::where('email', 'admin@cms.com')->first();
        $this->actingAs($admin);

        event(new TestCustomAuditableEvent('tiktok_star', 1500000));

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'SYNC_METRICS',
            'module' => 'TIKTOK',
            'record_id' => '@tiktok_star',
            'record_type' => 'TikTokChannel',
            'status' => 'SUCCESS',
        ]);
    }

    /**
     * Test auditSync on User model audits ROLE_CHANGE and PERMISSION_CHANGE.
     */
    public function test_user_audit_sync_records_activity_log(): void
    {
        $user = User::where('email', 'manager@cms.com')->first();
        $adminRole = Role::where('slug', 'admin')->first();

        // Sync role
        $user->syncRoles([$adminRole->id]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'ROLE_CHANGE',
            'module' => 'USER_MANAGEMENT',
            'record_id' => (string) $user->id,
            'record_type' => 'User',
            'status' => 'SUCCESS',
        ]);
    }
}
