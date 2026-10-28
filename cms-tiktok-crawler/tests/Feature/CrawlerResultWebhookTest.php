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
}
