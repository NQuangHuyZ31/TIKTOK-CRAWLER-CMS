<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Services\CrawlJobService;
use Modules\User\Models\User;
use Tests\TestCase;

class CrawlJobDateFilterTest extends TestCase
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

    public function test_service_persists_target_date_today(): void
    {
        /** @var CrawlJobService $service */
        $service = app(CrawlJobService::class);

        $job = $service->create([
            'source_type' => 'usernames',
            'crawl_mode' => 'account_with_videos',
            'max_videos_per_account' => 10,
            'target_date' => 'today',
            'data_crawl' => ['testcreator'],
        ]);

        $this->assertNotNull($job->id);
        $this->assertEquals('today', $job->target_date);

        // Fetch fresh from database
        $fresh = CrawlJob::find($job->id);
        $this->assertEquals('today', $fresh->target_date);
    }

    public function test_service_persists_custom_date_bounds(): void
    {
        /** @var CrawlJobService $service */
        $service = app(CrawlJobService::class);

        $job = $service->create([
            'source_type' => 'usernames',
            'crawl_mode' => 'account_with_videos',
            'max_videos_per_account' => 10,
            'target_date' => 'custom',
            'date_from' => '2026-11-01 00:00:00',
            'date_to' => '2026-11-09 23:59:59',
            'data_crawl' => ['testcreator'],
        ]);

        $this->assertEquals('custom', $job->target_date);
        $this->assertNotNull($job->date_from);
        $this->assertNotNull($job->date_to);

        $updated = $service->update($job->id, [
            'target_date' => 'yesterday',
        ]);
        $this->assertEquals('yesterday', $updated->target_date);
    }

    public function test_api_creates_job_with_target_date(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri('crawler/crawl-job'), [
                'source_type' => 'usernames',
                'crawl_mode' => 'account_with_videos',
                'max_videos_per_account' => 25,
                'target_date' => 'today',
                'data_crawl' => ['vtv24news'],
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertNotNull($data);
        $this->assertEquals('today', $data['target_date'] ?? null);

        $jobId = $data['id'];
        $job = CrawlJob::find($jobId);
        $this->assertNotNull($job);
        $this->assertEquals('today', $job->target_date);
    }

    public function test_crawler_engine_payload_includes_date_filter_fields(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response([
                'status' => 'queued',
                'job_id' => 'engine-job-123',
            ], 202),
        ]);

        /** @var CrawlJobService $service */
        $service = app(CrawlJobService::class);

        $job = $service->create([
            'source_type' => 'usernames',
            'crawl_mode' => 'account_with_videos',
            'max_videos_per_account' => 15,
            'target_date' => 'today',
            'data_crawl' => ['vtv24news'],
        ]);

        $service->start($job->id);

        Http::assertSent(function ($request) {
            $data = $request->data();
            return isset($data['target_date'])
                && $data['target_date'] === 'today'
                && $data['max_videos_per_account'] === 15;
        });
    }
}
