<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\TiktokAccount\Models\TiktokAccount;
use Tests\TestCase;

class CrawlerResultWebhookTest extends TestCase
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

    /**
     * Test successful crawl event links to existing tiktok account and updates metrics.
     */
    public function test_webhook_successful_crawl_links_existing_tiktok_account(): void
    {
        $account = TiktokAccount::create([
            'username' => 'existing_user',
            'status' => 'active',
            'followers_count' => 10,
        ]);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['existing_user']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        $response = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => 'existing_user',
                'followers' => 1500,
                'following' => 200,
                'likes' => 30000,
                'profile_url' => 'https://www.tiktok.com/@existing_user',
            ],
        ]);

        $response->assertStatus(201);
        $result = CrawlResult::where('crawl_job_id', $job->id)->first();
        $this->assertNotNull($result);
        $this->assertSame($account->id, $result->tiktok_account_id);
        $this->assertSame('existing_user', $result->username);
        $this->assertSame(1500, $result->followers_count);

        $account->refresh();
        $this->assertSame(1500, $account->followers_count);
    }

    /**
     * Test successful crawl event with leading '@' in username normalizes and links existing account.
     */
    public function test_webhook_successful_crawl_normalizes_at_sign_and_prevents_duplicate_account(): void
    {
        $account = TiktokAccount::create([
            'username' => 'clean_creator',
            'status' => 'active',
        ]);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['clean_creator']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        $response = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => '@clean_creator',
                'followers' => 9999,
                'following' => 100,
                'likes' => 50000,
            ],
        ]);

        $response->assertStatus(201);
        $result = CrawlResult::where('crawl_job_id', $job->id)->first();
        $this->assertNotNull($result);
        $this->assertSame($account->id, $result->tiktok_account_id);
        $this->assertSame('clean_creator', $result->username);

        // Verify no duplicate account with '@clean_creator' was created
        $this->assertSame(1, TiktokAccount::where('username', 'clean_creator')->count());
        $this->assertSame(0, TiktokAccount::where('username', '@clean_creator')->count());
    }

    /**
     * Test failed crawl event for existing account STILL links tiktok_account_id.
     */
    public function test_webhook_failed_crawl_preserves_existing_tiktok_account_id(): void
    {
        $account = TiktokAccount::create([
            'username' => 'failed_target',
            'status' => 'active',
        ]);

        $job = CrawlJob::create([
            'source_type' => 'database',
            'data_crawls' => json_encode([$account->id]),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        $response = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'failed',
            'username' => 'failed_target',
            'error_message' => 'Profile blocked or unavailable',
        ]);

        $response->assertStatus(201);
        $result = CrawlResult::where('crawl_job_id', $job->id)->first();
        $this->assertNotNull($result);
        $this->assertSame($account->id, $result->tiktok_account_id);
        $this->assertSame('failed_target', $result->username);
        $this->assertSame('failed', $result->status);
        $this->assertSame('Profile blocked or unavailable', $result->error_message);
    }

    public function test_webhook_started_event_and_idempotent_account_and_avatar_storage(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['avatar_user']),
            'total_accounts' => 1,
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        // 1. Started event transitions queued -> running
        $startRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'started',
            'job_id' => $job->id,
            'status' => 'running',
            'worker_id' => 'worker-1',
            'resumed' => true,
        ]);
        $startRes->assertStatus(200);
        $job->refresh();
        $this->assertSame('running', $job->status);
        $this->assertSame('worker-1', $job->worker_id);
        $this->assertSame(1, $job->resume_count);

        // 2. Account event with valid 1x1 PNG base64 avatar
        $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
        $accRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => 'avatar_user',
                'followers' => 100,
                'following' => 10,
                'likes' => 500,
                'avatar' => [
                    'content_base64' => base64_encode($pngBytes),
                    'mime' => 'image/png',
                ],
            ],
        ]);
        $accRes->assertStatus(201);

        // Sending duplicate account event is idempotent (still 1 CrawlResult row)
        $dupRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$job->id}/events"), [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => 'avatar_user',
                'followers' => 200,
                'following' => 10,
                'likes' => 500,
            ],
        ]);
        $dupRes->assertStatus(201);

        $this->assertSame(1, CrawlResult::where('crawl_job_id', $job->id)->count());
        $account = TiktokAccount::where('username', 'avatar_user')->firstOrFail();
        $this->assertNull($account->avatar_url);
        $this->assertSame('tiktok-accounts/avatars/avatar_user.png', $account->avatar_path);
        @unlink(public_path('tiktok-accounts/avatars/avatar_user.png'));

        // 3. Unfinished jobs endpoint returns running/queued jobs with done_accounts
        $unfinishedRes = $this->getJson($this->apiUri('public/crawler/jobs/unfinished'));
        $unfinishedRes->assertStatus(200);
        $unfinishedRes->assertJsonPath('data.0.job_id', $job->id);
        $unfinishedRes->assertJsonPath('data.0.done_accounts.0', 'avatar_user');

        // 4. Token verification rejects invalid token when configured
        config(['services.crawler.token' => 'secret-test-token']);
        $unauthRes = $this->getJson($this->apiUri('public/crawler/jobs/unfinished'));
        $unauthRes->assertStatus(401);

        $authRes = $this->withHeader('Authorization', 'Bearer secret-test-token')
            ->getJson($this->apiUri('public/crawler/jobs/unfinished'));
        $authRes->assertStatus(200);
    }

    public function test_job_tracks_creator_starter_and_filters_results(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            '*' => \Illuminate\Support\Facades\Http::response([
                'status' => 'queued',
                'targets' => ['alpha_user', 'beta_user'],
            ], 200),
        ]);

        $sanctumToken = $this->adminUser->createToken('spa-token')->plainTextToken;

        $createRes = $this->withHeader('Authorization', "Bearer {$sanctumToken}")
            ->postJson($this->apiUri('crawler/crawl-job'), [
                'source_type' => 'usernames',
                'data_crawl' => ['alpha_user', 'beta_user'],
            ]);
        $createRes->assertStatus(201);
        $jobId = $createRes->json('data.id');
        $this->assertSame($this->adminUser->id, $createRes->json('data.created_by'));
        $this->assertSame($this->adminUser->name, $createRes->json('data.created_by_name'));

        $startRes = $this->withHeader('Authorization', "Bearer {$sanctumToken}")
            ->postJson($this->apiUri("crawler/crawl-job/{$jobId}/start"));
        $startRes->assertStatus(200);
        $this->assertSame($this->adminUser->id, $startRes->json('data.started_by'));
        $this->assertSame($this->adminUser->name, $startRes->json('data.started_by_name'));

        CrawlResult::create([
            'crawl_job_id' => $jobId,
            'username' => 'alpha_user',
            'status' => 'success',
            'followers_count' => 5000,
            'following_count' => 100,
            'likes_count' => 25000,
            'crawled_at' => now(),
        ]);
        CrawlResult::create([
            'crawl_job_id' => $jobId,
            'username' => 'beta_user',
            'status' => 'failed',
            'followers_count' => 0,
            'following_count' => 0,
            'likes_count' => 0,
            'error_message' => 'Not found',
            'crawled_at' => now(),
        ]);

        $filterRes = $this->actingAs($this->adminUser)
            ->getJson($this->apiUri("crawler/crawl-job/{$jobId}/results?status=success&followers_count=1000..10000&search=alpha"));
        $filterRes->assertStatus(200);
        $this->assertSame(1, $filterRes->json('meta.total'));
        $this->assertSame('alpha_user', $filterRes->json('data.0.username'));

        // Manual stop transitions queued/running job to failed
        $stopRes = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$jobId}/stop"));
        $stopRes->assertStatus(200);
        $this->assertSame('failed', $stopRes->json('data.status'));
    }

    public function test_sync_active_jobs_preserves_running_status_and_sets_shutdown_message_when_service_is_offline(): void
    {
        $runningJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['stuck_user']),
            'total_accounts' => 1,
            'status' => 'running',
            'started_at' => now(),
        ]);

        config(['services.crawler.sync_in_tests' => true]);
        \Illuminate\Support\Facades\Http::fake([
            '*/api/queue' => \Illuminate\Support\Facades\Http::response(['error' => 'Service down'], 503),
        ]);

        $showRes = $this->actingAs($this->adminUser)
            ->getJson($this->apiUri("crawler/crawl-job/{$runningJob->id}"));
        $showRes->assertStatus(200);
        $this->assertSame('running', $showRes->json('data.status'));
        $this->assertSame(
            \Modules\Crawler\Services\CrawlJobService::SERVICE_SHUTDOWN_MESSAGE,
            $showRes->json('data.error_message')
        );

        // Also verify 'paused' webhook event from Python graceful shutdown preserves 'running' status
        $pauseRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$runningJob->id}/events"), [
            'event' => 'paused',
            'job_id' => $runningJob->id,
            'status' => 'running',
            'error_message' => \Modules\Crawler\Services\CrawlJobService::SERVICE_SHUTDOWN_MESSAGE,
        ]);
        $pauseRes->assertStatus(200);
        $this->assertSame('running', $pauseRes->json('status'));
    }
}
