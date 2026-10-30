<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;
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
}
