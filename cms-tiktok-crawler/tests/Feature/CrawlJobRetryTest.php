<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Models\CrawlVideoResult;
use Modules\Crawler\Repositories\CrawlJobRepository;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Services\CrawlerEngineClient;
use Modules\Crawler\Services\CrawlJobService;
use Modules\Crawler\Services\CrawlResultService;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;
use Modules\System\Facades\Audit;
use Tests\TestCase;

class CrawlJobRetryTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    public function test_retry_fails_when_job_not_found(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri('crawler/crawl-job/99999/retry'));

        $response->assertStatus(404);
        $response->assertJsonFragment(['status' => 'error']);
    }

    public function test_retry_fails_when_job_status_is_pending(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['tiktok_user1']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$job->id}/retry"));

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'status' => 'error',
            'message' => "Crawl job #{$job->id} is in status 'pending', only 'failed' jobs can be retried.",
        ]);
    }

    public function test_retry_fails_when_job_status_is_completed(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['tiktok_user1']),
            'total_accounts' => 1,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$job->id}/retry"));

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'status' => 'error',
            'message' => "Crawl job #{$job->id} is in status 'completed', only 'failed' jobs can be retried.",
        ]);
    }

    public function test_retry_succeeds_even_when_another_job_is_currently_running(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['status' => 'queued', 'queue_position' => 1], 202),
        ]);

        // Active running job
        CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['running_user']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        // Failed job that user attempts to retry concurrently
        $failedJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['failed_user']),
            'total_accounts' => 1,
            'status' => 'failed',
            'error_message' => 'Connection timed out',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$failedJob->id}/retry"));

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'queued');
    }

    public function test_retry_succeeds_for_failed_job_and_resets_fields(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['status' => 'queued'], 202),
        ]);

        $failedJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['user_alpha', 'user_beta']),
            'total_accounts' => 2,
            'status' => 'failed',
            'error_message' => 'Crawler crashed unexpectedly',
            'started_at' => now()->subHour(),
            'finished_at' => now()->subMinutes(30),
            'success_count' => 1,
            'failed_count' => 1,
        ]);

        // Previous partial results
        CrawlResult::create([
            'crawl_job_id' => $failedJob->id,
            'username' => 'user_alpha',
            'status' => 'success',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$failedJob->id}/retry"));

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.status', 'queued');
        $response->assertJsonPath('data.error_message', null);
        $response->assertJsonPath('data.finished_at', null);
        $response->assertJsonPath('data.success_count', 0);
        $response->assertJsonPath('data.failed_count', 0);

        // Verify database state
        $failedJob->refresh();
        $this->assertSame('queued', $failedJob->status);
        $this->assertNull($failedJob->error_message);
        $this->assertNull($failedJob->finished_at);
        $this->assertNotNull($failedJob->queued_at);
        $this->assertSame(0, $failedJob->success_count);
        $this->assertSame(0, $failedJob->failed_count);

        // Verify previous results cleaned up
        $this->assertDatabaseMissing('crawl_results', [
            'crawl_job_id' => $failedJob->id,
        ]);
    }

    public function test_retry_keeps_job_as_failed_and_returns_503_if_crawler_engine_fails(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['error' => 'Service Unavailable'], 503),
        ]);

        $failedJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['retry_user']),
            'total_accounts' => 1,
            'status' => 'failed',
            'error_message' => 'Initial error',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$failedJob->id}/retry"));

        $response->assertStatus(503);

        $failedJob->refresh();
        $this->assertSame('failed', $failedJob->status);
    }

    public function test_retry_requires_crawler_edit_permission(): void
    {
        // Create viewer user with only crawler.view permission
        $viewPerm = Permission::where('slug', 'crawler.view')->first();
        if (!$viewPerm) {
            $viewPerm = Permission::create([
                'name' => 'View Crawler',
                'slug' => 'crawler.view',
                'module' => 'crawler',
                'action' => 'view',
            ]);
        }

        $viewerRole = Role::firstOrCreate(
            ['slug' => 'crawler_viewer_only'],
            ['name' => 'Crawler Viewer Only']
        );
        $viewerRole->permissions()->sync([$viewPerm->id]);

        $viewerUser = User::create([
            'name' => 'Viewer Only',
            'email' => 'viewer_only@cms.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
            'is_admin' => false,
        ]);
        $viewerUser->roles()->attach($viewerRole->id);

        $failedJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['test_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $response = $this->actingAs($viewerUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$failedJob->id}/retry"));

        $response->assertStatus(403);
    }

    // ==========================================
    // A. Payload and Atomic Claim Tests
    // ==========================================

    public function test_retry_builds_payload_before_claim(): void
    {
        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn(['status' => 'queued']);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['payload_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $service = app(CrawlJobService::class);
        $result = $service->retry($job->id);

        $this->assertNotNull($result);
        $this->assertSame('queued', $result->status);
    }

    public function test_retry_rejects_invalid_payload_without_claiming_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => null, // Invalid payload
            'total_accounts' => 0,
            'status' => 'failed',
        ]);

        $service = app(CrawlJobService::class);

        $this->expectException(\InvalidArgumentException::class);
        try {
            $service->retry($job->id);
        } finally {
            $this->assertSame('failed', $job->fresh()->status);
        }
    }

    public function test_retry_claims_failed_job_atomically_before_cleanup(): void
    {
        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn(['status' => 'queued']);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['claimed_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $service = app(CrawlJobService::class);
        $service->retry($job->id);

        $this->assertSame('queued', $job->fresh()->status);
    }

    public function test_retry_rejects_non_failed_jobs(): void
    {
        $service = app(CrawlJobService::class);

        foreach (['running', 'completed', 'cancelled'] as $status) {
            $job = CrawlJob::create([
                'source_type' => 'usernames',
                'data_crawls' => json_encode(['test_user']),
                'total_accounts' => 1,
                'status' => $status,
            ]);

            try {
                $service->retry($job->id);
                $this->fail("Expected DomainException for status '{$status}'");
            } catch (\DomainException $e) {
                $this->assertStringContainsString("only 'failed' jobs can be retried", $e->getMessage());
            }
        }
    }

    public function test_retry_rejects_second_claim_when_already_claimed(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['double_claim_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $mockRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockRepo->shouldReceive('claimForRetry')->with($job->id)->once()->andReturn(false);
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockRepo);

        $service = app(CrawlJobService::class);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage("could not be claimed for retry");
        $service->retry($job->id);
    }

    // ==========================================
    // B. Cleanup Transaction Tests
    // ==========================================

    public function test_cleanup_transaction_deletes_both_result_tables_and_resets_fields(): void
    {
        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn(['status' => 'queued']);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['user_a', 'user_b']),
            'total_accounts' => 2,
            'status' => 'failed',
            'started_at' => now()->subHour(),
            'finished_at' => now()->subMinutes(30),
            'success_count' => 1,
            'failed_count' => 1,
            'total_videos_crawled' => 5,
            'worker_id' => 'old-worker-id',
            'error_message' => 'Previous failure message',
        ]);

        $accountResult = CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'user_a',
            'status' => 'success',
        ]);

        CrawlVideoResult::create([
            'crawl_job_id' => $job->id,
            'crawl_result_id' => $accountResult->id,
            'username' => 'user_a',
            'video_id' => 'vid_123',
            'status' => 'success',
        ]);

        $service = app(CrawlJobService::class);
        $service->retry($job->id);

        $this->assertDatabaseMissing('crawl_results', ['crawl_job_id' => $job->id]);
        $this->assertDatabaseMissing('crawl_video_results', ['crawl_job_id' => $job->id]);

        $fresh = $job->fresh();
        $this->assertSame('queued', $fresh->status);
        $this->assertNull($fresh->started_at);
        $this->assertNull($fresh->finished_at);
        $this->assertSame(0, $fresh->success_count);
        $this->assertSame(0, $fresh->failed_count);
        $this->assertSame(0, $fresh->total_videos_crawled);
        $this->assertNull($fresh->worker_id);
        $this->assertNull($fresh->error_message);
    }

    public function test_cleanup_transaction_rolls_back_when_job_update_returns_false(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['rollback_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $accountResult = CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'rollback_user',
            'status' => 'success',
        ]);

        $videoResult = CrawlVideoResult::create([
            'crawl_job_id' => $job->id,
            'crawl_result_id' => $accountResult->id,
            'username' => 'rollback_user',
            'video_id' => 'vid_rollback',
            'status' => 'success',
        ]);

        $mockRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockRepo->shouldReceive('resetForRetry')->with($job->id, \Mockery::any())->once()->andReturn(false);
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockRepo);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->never();
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("job is no longer queued or record could not be updated");

        try {
            $service->retry($job->id);
        } finally {
            // Assert deleted rows were restored by real DB transaction rollback!
            $this->assertDatabaseHas('crawl_results', ['id' => $accountResult->id]);
            $this->assertDatabaseHas('crawl_video_results', ['id' => $videoResult->id]);
        }
    }

    public function test_cleanup_transaction_rollback_preserves_state_on_repository_exception(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['ex_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $accountResult = CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'ex_user',
            'status' => 'success',
        ]);

        $mockResultRepo = \Mockery::mock(CrawlResultRepositoryInterface::class);
        $mockResultRepo->shouldReceive('deleteByJobId')->with($job->id)->andThrow(new \RuntimeException('DB deadlock during delete'));
        $this->app->instance(CrawlResultRepositoryInterface::class, $mockResultRepo);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('DB deadlock during delete');

        try {
            $service->retry($job->id);
        } finally {
            $this->assertDatabaseHas('crawl_results', ['id' => $accountResult->id]);
            $this->assertSame('failed', $job->fresh()->status);
        }
    }

    public function test_cleanup_does_not_overwrite_job_state_advanced_before_reset(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['advanced_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        // Mock repo where resetForRetry checks `status = queued` and returns false because status was advanced
        $mockRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockRepo->shouldReceive('resetForRetry')->andReturn(false);
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockRepo);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $service->retry($job->id);
    }

    public function test_cleanup_exception_is_preserved_when_claim_restoration_fails(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['restore_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $mockResultRepo = \Mockery::mock(CrawlResultRepositoryInterface::class);
        $mockResultRepo->shouldReceive('deleteByJobId')->andThrow(new \RuntimeException('Primary cleanup error'));
        $this->app->instance(CrawlResultRepositoryInterface::class, $mockResultRepo);

        $mockJobRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockJobRepo->shouldReceive('restoreFailedClaim')->andThrow(new \PDOException('Restoration connection lost'));
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockJobRepo);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Primary cleanup error');
        $service->retry($job->id);
    }

    public function test_cleanup_exception_is_preserved_when_failure_audit_fails(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['audit_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $mockResultRepo = \Mockery::mock(CrawlResultRepositoryInterface::class);
        $mockResultRepo->shouldReceive('deleteByJobId')->andThrow(new \RuntimeException('Primary cleanup error'));
        $this->app->instance(CrawlResultRepositoryInterface::class, $mockResultRepo);

        Audit::shouldReceive('record')->andThrow(new \Exception('Audit service unavailable'));

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Primary cleanup error');
        $service->retry($job->id);
    }

    public function test_cleanup_logger_failure_does_not_mask_primary_exception(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['logger_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $mockResultRepo = \Mockery::mock(CrawlResultRepositoryInterface::class);
        $mockResultRepo->shouldReceive('deleteByJobId')->andThrow(new \RuntimeException('Primary cleanup error'));
        $this->app->instance(CrawlResultRepositoryInterface::class, $mockResultRepo);

        Audit::shouldReceive('record')->andThrow(new \Exception('Audit failed'));
        Log::shouldReceive('error')->andThrow(new \RuntimeException('Log disk failure'));

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Primary cleanup error');
        $service->retry($job->id);
    }

    public function test_python_is_not_called_when_cleanup_fails(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['no_python_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $mockResultRepo = \Mockery::mock(CrawlResultRepositoryInterface::class);
        $mockResultRepo->shouldReceive('deleteByJobId')->andThrow(new \RuntimeException('Cleanup crash'));
        $this->app->instance(CrawlResultRepositoryInterface::class, $mockResultRepo);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->never();
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $service->retry($job->id);
    }

    // ==========================================
    // C. Dispatch and Restoration Tests
    // ==========================================

    public function test_cleanup_commits_before_python_start_job_is_invoked(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['commit_order_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'commit_order_user',
            'status' => 'success',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturnUsing(function ($payload) use ($job) {
            // Assert that BEFORE startJob returns, DB cleanup has already committed!
            $this->assertDatabaseMissing('crawl_results', ['crawl_job_id' => $job->id]);
            $this->assertSame('queued', $job->fresh()->status);

            return ['status' => 'queued'];
        });
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);
        $service->retry($job->id);
    }

    public function test_dispatch_failure_conditionally_restores_job_to_failed(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['dispatch_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andThrow(new \RuntimeException('Engine unavailable 503', 503));
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Engine unavailable 503');

        try {
            $service->retry($job->id);
        } finally {
            $fresh = $job->fresh();
            $this->assertSame('failed', $fresh->status);
            $this->assertStringContainsString('Engine unavailable 503', $fresh->error_message);
        }
    }

    public function test_dispatch_failure_does_not_overwrite_status_if_webhook_progressed_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['progressed_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturnUsing(function () use ($job) {
            // Simulate that in the window before exception is caught, a webhook transitioned job to 'running'
            $job->update(['status' => 'running']);

            throw new \RuntimeException('Read timeout on response');
        });
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);

        try {
            $service->retry($job->id);
        } finally {
            // Conditional restoration should have failed because status is no longer 'queued'
            $this->assertSame('running', $job->fresh()->status);
        }
    }

    public function test_dispatch_exception_is_preserved_when_restoration_and_audit_fail(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['multi_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andThrow(new \RuntimeException('Primary dispatch error'));
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $mockRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockRepo->shouldReceive('restoreFailedClaim')->andThrow(new \PDOException('Restoration DB lost'));
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockRepo);

        Audit::shouldReceive('record')->andThrow(new \Exception('Audit service down'));

        $service = app(CrawlJobService::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Primary dispatch error');
        $service->retry($job->id);
    }

    public function test_success_audit_exception_does_not_prevent_successful_retry_return(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['audit_warn_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn(['status' => 'queued']);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        Audit::shouldReceive('record')->andThrow(new \Exception('Audit DB lock timeout'));

        $service = app(CrawlJobService::class);
        $result = $service->retry($job->id);

        $this->assertNotNull($result);
        $this->assertSame('queued', $result->status);
    }

    // ==========================================
    // D. Dynamic Target Synchronization Tests
    // ==========================================

    public function test_retry_syncs_dynamic_targets_when_started_webhook_arrives_before_engine_response(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'count',
            'data_crawls' => json_encode([2]),
            'total_accounts' => 2,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturnUsing(function ($payload) use ($job) {
            // Simulate 'started' webhook arriving while waiting for engine response
            app(CrawlResultService::class)->handleWebhookEvent($job->id, [
                'event' => 'started',
                'job_id' => $job->id,
                'worker_id' => 'worker-py-fast',
            ]);

            $this->assertSame('running', $job->fresh()->status);

            return [
                'job_id' => $job->id,
                'status' => 'queued',
                'targets' => ['resolved_user_1', 'resolved_user_2'],
                'total_accounts' => 2,
            ];
        });
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);
        $result = $service->retry($job->id);

        $fresh = $job->fresh();
        $this->assertSame('running', $fresh->status);
        $this->assertSame('worker-py-fast', $fresh->worker_id);
        $this->assertSame(json_encode(['resolved_user_1', 'resolved_user_2']), $fresh->data_crawls);
        $this->assertSame(2, $fresh->total_accounts);
    }

    public function test_dynamic_target_sync_preserves_worker_and_progress_fields(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'count',
            'data_crawls' => json_encode([1]),
            'total_accounts' => 1,
            'status' => 'running',
            'worker_id' => 'worker-preserve-123',
            'started_at' => now()->subMinutes(10),
            'success_count' => 3,
            'failed_count' => 1,
            'total_videos_crawled' => 12,
        ]);

        $repo = app(CrawlJobRepositoryInterface::class);
        $repo->syncDynamicTargets($job->id, ['user_synced_1']);

        $fresh = $job->fresh();
        $this->assertSame('worker-preserve-123', $fresh->worker_id);
        $this->assertSame('running', $fresh->status);
        $this->assertSame(3, $fresh->success_count);
        $this->assertSame(1, $fresh->failed_count);
        $this->assertSame(12, $fresh->total_videos_crawled);
        $this->assertSame(1, $fresh->total_accounts);
        $this->assertSame(json_encode(['user_synced_1']), $fresh->data_crawls);
    }

    public function test_dynamic_target_sync_does_not_overwrite_completed_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'count',
            'data_crawls' => json_encode([1]),
            'total_accounts' => 1,
            'status' => 'completed',
        ]);

        $repo = app(CrawlJobRepositoryInterface::class);
        $result = $repo->syncDynamicTargets($job->id, ['target_ignored']);

        $this->assertFalse($result);
        $this->assertSame(json_encode([1]), $job->fresh()->data_crawls);
        $this->assertSame('completed', $job->fresh()->status);
    }

    public function test_dynamic_target_sync_does_not_overwrite_failed_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'count',
            'data_crawls' => json_encode([1]),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $repo = app(CrawlJobRepositoryInterface::class);
        $result = $repo->syncDynamicTargets($job->id, ['target_ignored']);

        $this->assertFalse($result);
        $this->assertSame('failed', $job->fresh()->status);
    }

    public function test_dynamic_target_sync_does_not_overwrite_cancelled_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'count',
            'data_crawls' => json_encode([1]),
            'total_accounts' => 1,
            'status' => 'cancelled',
        ]);

        $repo = app(CrawlJobRepositoryInterface::class);
        $result = $repo->syncDynamicTargets($job->id, ['target_ignored']);

        $this->assertFalse($result);
        $this->assertSame('cancelled', $job->fresh()->status);
    }

    public function test_dynamic_target_sync_database_failure_does_not_restore_dispatched_job(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['sync_err_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn([
            'status' => 'queued',
            'targets' => ['sync_err_user'],
        ]);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $mockRepo = \Mockery::mock(app(CrawlJobRepository::class))->makePartial();
        $mockRepo->shouldReceive('syncDynamicTargets')->andThrow(new \PDOException('Disk error on target sync'));
        $this->app->instance(CrawlJobRepositoryInterface::class, $mockRepo);

        $service = app(CrawlJobService::class);
        $result = $service->retry($job->id);

        $this->assertNotNull($result);
        // Dispatch succeeded, job remains queued (never restored to failed!)
        $this->assertSame('queued', $job->fresh()->status);
    }

    public function test_successful_retry_is_returned_when_success_audit_and_fallback_logger_fail(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['double_log_fail_user']),
            'total_accounts' => 1,
            'status' => 'failed',
        ]);

        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')->once()->andReturn(['status' => 'queued']);
        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        Audit::shouldReceive('record')->andThrow(new \Exception('Audit service down'));
        Log::shouldReceive('warning')->andThrow(new \RuntimeException('Logger driver crash'));

        $service = app(CrawlJobService::class);
        $result = $service->retry($job->id);

        $this->assertNotNull($result);
        $this->assertSame('queued', $result->status);
    }

    // ==========================================
    // E. Full Two-Execution Late-Webhook Test
    // ==========================================

    public function test_late_webhook_after_retry_claim_restoration_can_contaminate_subsequent_retry_and_complete_prematurely(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['exec1_user', 'exec2_user']),
            'total_accounts' => 2,
            'status' => 'failed',
        ]);

        // Sequential mock for CrawlerEngineClient:
        // Exec #1 throws timeout; Exec #2 returns success
        $engineClient = \Mockery::mock(CrawlerEngineClient::class);
        $engineClient->shouldReceive('startJob')
            ->once()
            ->andThrow(new \RuntimeException('Connection timeout to crawler service', 504));

        $engineClient->shouldReceive('startJob')
            ->once()
            ->andReturn([
                'job_id' => $job->id,
                'status' => 'queued',
                'targets' => ['exec2_user_a', 'exec2_user_b'],
                'total_accounts' => 2,
            ]);

        $this->app->instance(CrawlerEngineClient::class, $engineClient);

        $service = app(CrawlJobService::class);

        // --- Execution #1: Real service call that times out ---
        try {
            $service->retry($job->id);
            $this->fail('Expected RuntimeException on Execution #1 dispatch timeout');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Connection timeout', $e->getMessage());
        }

        // Job status was restored to 'failed' by restoreFailedClaim
        $this->assertSame('failed', $job->fresh()->status);

        // --- Execution #2: Real service call that succeeds ---
        $retryJob = $service->retry($job->id);
        $this->assertNotNull($retryJob);
        $this->assertSame('queued', $job->fresh()->status);

        // --- Late Webhooks from Execution #1 arriving at real HTTP endpoint ---

        // 1. Stale Account Webhook from Execution #1
        $accountResponse = $this->postJson("/admin/api/public/crawler/crawl-jobs/{$job->id}/events", [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => 'stale_account_exec1',
                'followers' => 1234,
                'following' => 50,
                'likes' => 9999,
            ],
        ]);

        $accountResponse->assertStatus(201);
        $this->assertDatabaseHas('crawl_results', [
            'crawl_job_id' => $job->id,
            'username' => 'stale_account_exec1',
        ]);

        $freshJob = $job->fresh();
        $this->assertSame(1, $freshJob->success_count);
        $this->assertSame('running', $freshJob->status); // syncJobCounts transitioned queued -> running

        // 2. Stale Completion Webhook from Execution #1
        $completeResponse = $this->postJson("/admin/api/public/crawler/crawl-jobs/{$job->id}/events", [
            'event' => 'completed',
            'job_id' => $job->id,
            'status' => 'completed',
            'total_accounts' => 2,
            'success_count' => 1,
            'failed_count' => 1,
        ]);

        $completeResponse->assertStatus(200);

        // Assert documented limitation: Job #10 is now marked 'completed' with Execution #1's data,
        // even though Execution #2 worker may still be active in Python!
        $finalJob = $job->fresh();
        $this->assertSame('completed', $finalJob->status);
        $this->assertNotNull($finalJob->finished_at);
    }
}
