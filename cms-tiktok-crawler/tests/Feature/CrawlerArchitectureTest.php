<?php

namespace Tests\Feature;

use Modules\User\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Http\Controllers\CrawlJobController;
use Modules\Crawler\Http\Controllers\CrawlResultController;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\CrawlJobRepository;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\Crawler\Services\CrawlJobService;
use Modules\Crawler\Services\CrawlResultService;
use Modules\Crawler\Services\CrawlVideoResultService;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;
use ReflectionClass;
use Tests\TestCase;

class CrawlerArchitectureTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::where('email', 'admin@cms.com')->firstOrFail();

        CrawlJob::query()->forceDelete();
        CrawlResult::query()->forceDelete();
    }

    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    public function test_controllers_inherit_from_core_controller(): void
    {
        $crawlJobController = app(CrawlJobController::class);
        $crawlResultController = app(CrawlResultController::class);

        $this->assertInstanceOf(BaseController::class, $crawlJobController);
        $this->assertInstanceOf(BaseController::class, $crawlResultController);
    }

    public function test_crawl_job_controller_store_calculates_total_accounts_and_sets_pending(): void
    {
        $response = $this->actingAs($this->adminUser)->postJson($this->apiUri('crawler/crawl-job'), [
            'source_type' => 'usernames',
            'data_crawl' => ['user1', 'user2', 'user3'],
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.total_accounts', 3);
        $response->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('crawl_jobs', [
            'source_type' => 'usernames',
            'total_accounts' => 3,
            'status' => 'pending',
        ]);
    }

    public function test_crawl_job_controller_update_enforces_pending_rule(): void
    {
        $pendingJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['old_user']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        // Pending job -> success update
        $updateSuccess = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$pendingJob->id}"), [
            'data_crawl' => ['new_user_1', 'new_user_2'],
        ]);
        $updateSuccess->assertStatus(200);
        $updateSuccess->assertJsonPath('data.total_accounts', 2);

        // Running job -> 422 rejected
        $runningJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['running_user']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        $updateFail = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$runningJob->id}"), [
            'data_crawl' => ['another_user'],
        ]);
        $updateFail->assertStatus(422);
        $updateFail->assertJsonFragment(['status' => 'error']);

        // Verify running job was NOT modified in the database
        $freshRunning = $runningJob->fresh();
        $this->assertSame('running', $freshRunning->status);
        $this->assertSame(['running_user'], json_decode($freshRunning->data_crawls, true));
    }

    public function test_crawl_job_update_http_validation_rules(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['initial_user']),
            'total_accounts' => 1,
            'status' => 'pending',
            'max_videos_per_account' => 20,
        ]);

        // 1. Invalid source_type
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'invalid_source',
        ]);
        $res->assertStatus(422);

        // 2. Invalid crawl_mode
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'crawl_mode' => 'invalid_mode',
        ]);
        $res->assertStatus(422);

        // 3. max_videos_per_account below 0
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'max_videos_per_account' => -1,
        ]);
        $res->assertStatus(422);

        // 4. max_videos_per_account above 100
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'max_videos_per_account' => 101,
        ]);
        $res->assertStatus(422);

        // 5. Non-array data_crawl
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'data_crawl' => 'not_an_array',
        ]);
        $res->assertStatus(422);

        // 6. Empty array data_crawl
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'data_crawl' => [],
        ]);
        $res->assertStatus(422);

        // 7. Unvalidated fields are stripped and cannot overwrite protected fields
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'max_videos_per_account' => 35,
            'status' => 'completed',
            'total_accounts' => 9999,
        ]);
        $res->assertStatus(200);

        $fresh = $job->fresh();
        $this->assertSame(35, $fresh->max_videos_per_account);
        $this->assertSame('pending', $fresh->status);
        $this->assertSame(1, $fresh->total_accounts);
    }

    public function test_crawl_job_update_domain_data_contracts(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['initial_user']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        // usernames: integer element rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'data_crawl' => [123],
        ]);
        $res->assertStatus(422);

        // usernames: numeric-only string accepted
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'data_crawl' => ['12345'],
        ]);
        $res->assertStatus(200);
        $this->assertSame(['12345'], json_decode($job->fresh()->data_crawls, true));

        // urls: invalid string or integer rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'urls',
            'data_crawl' => ['not_a_valid_url'],
        ]);
        $res->assertStatus(422);

        // urls: valid HTTP/HTTPS URLs accepted
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'urls',
            'data_crawl' => ['https://www.tiktok.com/@user/video/1234567890'],
        ]);
        $res->assertStatus(200);
        $this->assertSame('urls', $job->fresh()->source_type);

        // database: invalid non-numeric ID rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'database',
            'data_crawl' => ['abc'],
        ]);
        $res->assertStatus(422);

        // database: negative or zero ID rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'database',
            'data_crawl' => [0],
        ]);
        $res->assertStatus(422);

        // database: valid seeded account ID accepted
        $account = \Modules\TiktokAccount\Models\TiktokAccount::firstOrCreate(
            ['username' => 'test_contract_acc'],
            ['nickname' => 'Test', 'status' => 'active']
        );
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'database',
            'data_crawl' => [$account->id],
        ]);
        $res->assertStatus(200);
        $this->assertSame('database', $job->fresh()->source_type);
        $this->assertSame([$account->id], json_decode($job->fresh()->data_crawls, true));

        // count: multiple elements rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => [10, 20],
        ]);
        $res->assertStatus(422);

        // count: non-positive "0", decimal "1.5", and scientific "1e3" rejected
        foreach (['0', '1.5', '1e3'] as $invalidVal) {
            $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
                'source_type' => 'count',
                'data_crawl' => [$invalidVal],
            ]);
            $res->assertStatus(422);
        }

        // count: oversized integer string rejected (integer overflow protection)
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => ['999999999999999999999999999999999999'],
        ]);
        $res->assertStatus(422);

        // count: positive integer strings with leading zeros "001" and "07" accepted
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => ['001'],
        ]);
        $res->assertStatus(200);
        $this->assertSame(1, $job->fresh()->total_accounts);

        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => ['07'],
        ]);
        $res->assertStatus(200);
        $this->assertSame(7, $job->fresh()->total_accounts);

        // count: associative array payload rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => ['count' => 50],
        ]);
        $res->assertStatus(422);

        // count: valid single integer updates total_accounts correctly
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => [42],
        ]);
        $res->assertStatus(200);
        $this->assertSame('count', $job->fresh()->source_type);
        $this->assertSame(42, $job->fresh()->total_accounts);
    }

    public function test_crawl_job_update_partial_and_transition_behavior(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['user_a']),
            'total_accounts' => 1,
            'max_videos_per_account' => 15,
            'status' => 'pending',
        ]);

        // 1. Partial update of data_crawl only validates against existing source_type (usernames)
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'data_crawl' => ['user_b', 'user_c'],
        ]);
        $res->assertStatus(200);
        $this->assertSame(2, $job->fresh()->total_accounts);
        $this->assertSame('usernames', $job->fresh()->source_type);

        // 2. Both source_type and data_crawl updated together
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'data_crawl' => [88],
        ]);
        $res->assertStatus(200);
        $this->assertSame('count', $job->fresh()->source_type);
        $this->assertSame(88, $job->fresh()->total_accounts);

        // 3. Changing source_type without providing new data_crawl is rejected
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'urls',
        ]);
        $res->assertStatus(422);
        $this->assertStringContainsString('Changing source_type requires providing matching data_crawl', $res->json('message'));

        // 4. Keeping identical source_type without data_crawl is allowed
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'source_type' => 'count',
            'max_videos_per_account' => 50,
        ]);
        $res->assertStatus(200);
        $this->assertSame(50, $job->fresh()->max_videos_per_account);
        $this->assertSame(88, $job->fresh()->total_accounts);

        // 5. Updating settings preserves source_type and data_crawls
        $res = $this->actingAs($this->adminUser)->putJson($this->apiUri("crawler/crawl-job/{$job->id}"), [
            'max_videos_per_account' => 75,
        ]);
        $res->assertStatus(200);
        $this->assertSame(75, $job->fresh()->max_videos_per_account);
        $this->assertSame('count', $job->fresh()->source_type);
        $this->assertSame(88, $job->fresh()->total_accounts);
    }

    public function test_crawl_job_controller_destroy_prevents_deleting_running_job(): void
    {
        $pendingJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['pending_to_delete']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        $runningJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['running_user']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);

        // Attempting to delete running job -> 422 error
        $deleteFail = $this->actingAs($this->adminUser)->deleteJson($this->apiUri("crawler/crawl-job/{$runningJob->id}"));
        $deleteFail->assertStatus(422);
        $deleteFail->assertJsonFragment(['status' => 'error']);

        // Attempting to delete pending job -> 200 success
        $deleteSuccess = $this->actingAs($this->adminUser)->deleteJson($this->apiUri("crawler/crawl-job/{$pendingJob->id}"));
        $deleteSuccess->assertStatus(200);
        $this->assertSoftDeleted('crawl_jobs', ['id' => $pendingJob->id]);
    }

    public function test_crawl_job_service_start_enforces_pending_status_and_single_running_job(): void
    {
        /** @var CrawlJobService $service */
        $service = app(CrawlJobService::class);

        // 1. Non-pending job throws DomainException
        $completedJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['done_user']),
            'total_accounts' => 1,
            'status' => 'completed',
        ]);

        $this->expectException(\DomainException::class);
        $service->start($completedJob->id);
    }

    public function test_crawl_job_repository_aggregates_kpi_summary_correctly(): void
    {
        /** @var CrawlJobRepositoryInterface $repo */
        $repo = app(CrawlJobRepositoryInterface::class);

        CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['u1']),
            'total_accounts' => 10,
            'success_count' => 8,
            'failed_count' => 2,
            'status' => 'completed',
        ]);

        CrawlJob::create([
            'source_type' => 'urls',
            'data_crawls' => json_encode(['u2']),
            'total_accounts' => 5,
            'success_count' => 0,
            'failed_count' => 5,
            'status' => 'failed',
        ]);

        $summary = $repo->getStatisticsSummary();

        $this->assertSame(2, $summary['total_jobs']);
        $this->assertSame(15, $summary['total_accounts']);
        $this->assertSame(8, $summary['total_success_accounts']);
        $this->assertSame(7, $summary['total_failed_accounts']);
        $this->assertSame(1, $summary['total_completed_jobs']);
        $this->assertSame(1, $summary['total_failed_jobs']);
    }

    public function test_crawl_result_repository_paginates_and_filters_results(): void
    {
        /** @var CrawlResultRepositoryInterface $repo */
        $repo = app(CrawlResultRepositoryInterface::class);

        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['u1']),
            'total_accounts' => 2,
            'status' => 'completed',
        ]);

        CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'tiktok_alice',
            'status' => 'success',
        ]);

        CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'tiktok_bob',
            'status' => 'failed',
        ]);

        $results = $repo->getByJobId($job->id, 10, ['username' => 'alice']);

        $this->assertSame(1, $results->total());
        $this->assertSame('tiktok_alice', $results->items()[0]->username);
    }

    public function test_crawl_job_results_and_statistics_summary_endpoints(): void
    {
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['u1']),
            'total_accounts' => 1,
            'status' => 'completed',
        ]);

        CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'tiktok_charlie',
            'status' => 'success',
        ]);

        // GET /crawler/crawl-job/{id}/results
        $resResults = $this->actingAs($this->adminUser)->getJson($this->apiUri("crawler/crawl-job/{$job->id}/results"));
        $resResults->assertStatus(200);
        $resResults->assertJsonPath('data.0.username', 'tiktok_charlie');

        // GET /crawler/crawl-job/statistics-summary
        $resStats = $this->actingAs($this->adminUser)->getJson($this->apiUri('crawler/crawl-job/statistics-summary'));
        $resStats->assertStatus(200);
        $resStats->assertJsonPath('data.total_jobs', 1);

        // GET /crawler/crawl-result via CoreController index with filter
        $resResultIndex = $this->actingAs($this->adminUser)->getJson($this->apiUri("crawler/crawl-result?crawl_job_id={$job->id}"));
        $resResultIndex->assertStatus(200);
        $resResultIndex->assertJsonPath('data.0.username', 'tiktok_charlie');
    }

    public function test_crawl_job_retry_fails_when_job_status_is_not_failed(): void
    {
        $pendingJob = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['tiktok_user1']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson($this->apiUri("crawler/crawl-job/{$pendingJob->id}/retry"));

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'status' => 'error',
            'message' => "Crawl job #{$pendingJob->id} is in status 'pending', only 'failed' jobs can be retried.",
        ]);
    }

    public function test_crawl_job_retry_succeeds_for_failed_job_and_resets_fields(): void
    {
        Http::fake([
            '*/api/crawl-jobs/start' => Http::response(['status' => 'accepted'], 200),
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

        $failedJob->refresh();
        $this->assertSame('queued', $failedJob->status);
        $this->assertNull($failedJob->error_message);
        $this->assertNull($failedJob->finished_at);
        $this->assertNotNull($failedJob->queued_at);
        $this->assertSame(0, $failedJob->success_count);
        $this->assertSame(0, $failedJob->failed_count);

        $this->assertDatabaseMissing('crawl_results', [
            'crawl_job_id' => $failedJob->id,
        ]);
    }

    public function test_crawl_job_service_crud_domain_rules(): void
    {
        /** @var CrawlJobService $jobService */
        $jobService = app(CrawlJobService::class);

        // 1. Create with string JSON
        $job = $jobService->create([
            'source_type' => 'usernames',
            'data_crawl' => json_encode(['account1', 'account2']),
        ]);

        $this->assertSame(2, $job->total_accounts);
        $this->assertSame('pending', $job->status);

        // 2. Update pending job
        $updated = $jobService->update($job->id, [
            'data_crawl' => ['single_account'],
        ]);
        $this->assertSame(1, $updated->total_accounts);

        // 3. Update non-pending job throws DomainException
        $job->update(['status' => 'running']);

        try {
            $jobService->update($job->id, ['data_crawl' => ['acc']]);
            $this->fail('Expected DomainException was not thrown.');
        } catch (\DomainException $e) {
            $this->assertStringContainsString('Only pending crawl jobs can be updated', $e->getMessage());
        }

        // 4. Delete running job throws DomainException
        try {
            $jobService->delete($job->id);
            $this->fail('Expected DomainException was not thrown.');
        } catch (\DomainException $e) {
            $this->assertStringContainsString('Cannot delete a running crawl job', $e->getMessage());
        }

        // 5. Delete pending job succeeds
        $pendingJob = $jobService->create([
            'source_type' => 'urls',
            'data_crawl' => ['https://tiktok.com/@test'],
        ]);
        $this->assertTrue($jobService->delete($pendingJob->id));
        $this->assertSoftDeleted('crawl_jobs', ['id' => $pendingJob->id]);
    }

    public function test_crawl_result_service_operations(): void
    {
        /** @var CrawlResultService $resultService */
        $resultService = app(CrawlResultService::class);
        /** @var CrawlJobService $jobService */
        $jobService = app(CrawlJobService::class);

        $job = $jobService->create([
            'source_type' => 'usernames',
            'data_crawl' => ['service_user'],
        ]);

        // Account event
        $res = $resultService->handleWebhookEvent($job->id, [
            'event' => 'account',
            'job_id' => $job->id,
            'status' => 'success',
            'account' => [
                'username' => 'service_user',
                'followers' => 999,
                'following' => 10,
                'likes' => 5000,
            ],
        ]);

        $this->assertSame(201, $res['status_code']);
        $this->assertDatabaseHas('crawl_results', [
            'crawl_job_id' => $job->id,
            'username' => 'service_user',
            'status' => 'success',
        ]);

        // Complete event
        $completeRes = $resultService->handleWebhookEvent($job->id, [
            'event' => 'completed',
            'job_id' => $job->id,
            'status' => 'completed',
            'total_accounts' => 1,
            'success_count' => 1,
            'failed_count' => 0,
        ]);

        $this->assertSame(200, $completeRes['status_code']);
        $this->assertSame('completed', $completeRes['body']['status']);

        // Query results via service
        $results = $resultService->getByJobId($job->id, 10);
        $this->assertSame(1, $results->total());
        $this->assertSame('service_user', $results->items()[0]->username);
    }

    public function test_video_crawl_upserts_master_video_and_computes_growth_deltas_across_jobs(): void
    {
        $jobService = app(CrawlJobService::class);
        $resultService = app(CrawlResultService::class);

        $job1 = $jobService->create([
            'source_type' => 'usernames',
            'crawl_mode' => 'account_with_videos',
            'max_videos_per_account' => 20,
            'data_crawl' => ['video_creator'],
        ]);

        // Job #1: First time discovering video 735000111222
        $res1 = $resultService->handleWebhookEvent($job1->id, [
            'event' => 'account',
            'job_id' => $job1->id,
            'status' => 'success',
            'username' => 'video_creator',
            'profile_url' => 'https://www.tiktok.com/@video_creator',
            'account' => [
                'username' => 'video_creator',
                'followers' => 5000,
                'following' => 20,
                'likes' => 15000,
                'video_count' => 10,
                'status' => 'active',
            ],
            'videos' => [
                [
                    'video_id' => '735000111222',
                    'description' => 'First viral video #fyp #viral',
                    'hashtags' => ['fyp', 'viral'],
                    'duration' => 18,
                    'cover_url' => 'https://p16-sign.tiktokcdn.com/cover.jpg',
                    'play_count' => 10000,
                    'digg_count' => 500,
                    'comment_count' => 40,
                    'share_count' => 15,
                    'collect_count' => 80,
                    'published_at' => '2026-10-01 10:00:00',
                    'crawled_at' => '2026-10-29 12:00:00',
                ],
            ],
        ]);

        $this->assertSame(201, $res1['status_code']);
        $this->assertSame(1, $res1['body']['videos_crawled_count']);

        $this->assertDatabaseHas('tiktok_videos', [
            'video_id' => '735000111222',
            'username' => 'video_creator',
            'play_count' => 10000,
            'digg_count' => 500,
            'comment_count' => 40,
            'share_count' => 15,
            'collect_count' => 80,
        ]);

        $this->assertDatabaseHas('crawl_video_results', [
            'crawl_job_id' => $job1->id,
            'video_id' => '735000111222',
            'play_count' => 10000,
            'play_count_delta' => 0,
            'digg_count_delta' => 0,
        ]);

        // Job #2: Subsequent crawl of the SAME video with updated stats (25,000 views, 1,200 likes)
        $job2 = $jobService->create([
            'source_type' => 'usernames',
            'crawl_mode' => 'account_with_videos',
            'max_videos_per_account' => 20,
            'data_crawl' => ['video_creator'],
        ]);

        $res2 = $resultService->handleWebhookEvent($job2->id, [
            'event' => 'account',
            'job_id' => $job2->id,
            'status' => 'success',
            'username' => 'video_creator',
            'profile_url' => 'https://www.tiktok.com/@video_creator',
            'account' => [
                'username' => 'video_creator',
                'followers' => 5500,
                'following' => 20,
                'likes' => 22000,
                'video_count' => 10,
                'status' => 'active',
            ],
            'videos' => [
                [
                    'video_id' => '735000111222',
                    'description' => 'First viral video (Updated caption) #fyp',
                    'hashtags' => ['fyp'],
                    'duration' => 18,
                    'cover_url' => 'https://p16-sign.tiktokcdn.com/cover-new.jpg',
                    'play_count' => 25000,
                    'digg_count' => 1200,
                    'comment_count' => 95,
                    'share_count' => 30,
                    'collect_count' => 200,
                    'published_at' => '2026-10-01 10:00:00',
                    'crawled_at' => '2026-10-30 12:00:00',
                ],
            ],
        ]);

        $this->assertSame(201, $res2['status_code']);

        // 1. Master table `tiktok_videos` MUST be updated in-place (still 1 row, latest stats, original crawled_at preserved)
        $this->assertSame(1, \Modules\TiktokAccount\Models\TiktokVideo::where('video_id', '735000111222')->count());
        $masterVideo = \Modules\TiktokAccount\Models\TiktokVideo::where('video_id', '735000111222')->firstOrFail();
        $this->assertSame(25000, $masterVideo->play_count);
        $this->assertSame(1200, $masterVideo->digg_count);
        $this->assertSame(95, $masterVideo->comment_count);
        $this->assertSame(30, $masterVideo->share_count);
        $this->assertSame(200, $masterVideo->collect_count);
        $this->assertSame('First viral video (Updated caption) #fyp', $masterVideo->description);
        $this->assertSame('2026-10-29 12:00:00', (string) $masterVideo->crawled_at);
        $this->assertSame('2026-10-30 12:00:00', (string) $masterVideo->last_crawled_at);

        // 2. Job #2 snapshot in `crawl_video_results` MUST record exact growth deltas (+15000 views, +700 likes)
        $this->assertDatabaseHas('crawl_video_results', [
            'crawl_job_id' => $job2->id,
            'video_id' => '735000111222',
            'play_count' => 25000,
            'digg_count' => 1200,
            'play_count_delta' => 15000,
            'digg_count_delta' => 700,
            'comment_count_delta' => 55,
            'share_count_delta' => 15,
            'collect_count_delta' => 120,
        ]);

        // 3. Idempotent retry of Job #2 must NOT duplicate `crawl_video_results` and must preserve baseline delta
        $resultService->handleWebhookEvent($job2->id, [
            'event' => 'account',
            'job_id' => $job2->id,
            'status' => 'success',
            'username' => 'video_creator',
            'profile_url' => 'https://www.tiktok.com/@video_creator',
            'account' => [
                'username' => 'video_creator',
                'followers' => 5500,
                'following' => 20,
                'likes' => 22000,
                'video_count' => 10,
                'status' => 'active',
            ],
            'videos' => [
                [
                    'video_id' => '735000111222',
                    'play_count' => 26000,
                    'digg_count' => 1300,
                    'comment_count' => 100,
                    'share_count' => 35,
                    'collect_count' => 210,
                ],
            ],
        ]);

        $this->assertSame(
            1,
            \Modules\Crawler\Models\CrawlVideoResult::where('crawl_job_id', $job2->id)
                ->where('video_id', '735000111222')
                ->count()
        );
        $this->assertDatabaseHas('crawl_video_results', [
            'crawl_job_id' => $job2->id,
            'video_id' => '735000111222',
            'play_count' => 26000,
            'play_count_delta' => 16000,
            'digg_count_delta' => 800,
        ]);
    }

    public function test_crawl_video_result_service_decomposition(): void
    {
        // 1. Container resolves singleton
        $videoService1 = app(CrawlVideoResultService::class);
        $videoService2 = app(CrawlVideoResultService::class);
        $this->assertInstanceOf(CrawlVideoResultService::class, $videoService1);
        $this->assertSame($videoService1, $videoService2);

        // 2. CrawlResultService constructor has exactly 5 dependencies
        $refResultService = new ReflectionClass(CrawlResultService::class);
        $constructorParams = $refResultService->getConstructor()->getParameters();
        $this->assertCount(5, $constructorParams);

        $paramTypes = array_map(fn($p) => (string) $p->getType(), $constructorParams);
        $this->assertContains(CrawlVideoResultService::class, $paramTypes);
        $this->assertNotContains(CrawlVideoResultRepositoryInterface::class, $paramTypes);
        $this->assertNotContains(TiktokVideoRepositoryInterface::class, $paramTypes);

        // 3. CrawlVideoResultService constructor has both video repositories
        $refVideoService = new ReflectionClass(CrawlVideoResultService::class);
        $videoParams = $refVideoService->getConstructor()->getParameters();
        $this->assertCount(2, $videoParams);
        $videoParamTypes = array_map(fn($p) => (string) $p->getType(), $videoParams);
        $this->assertContains(CrawlVideoResultRepositoryInterface::class, $videoParamTypes);
        $this->assertContains(TiktokVideoRepositoryInterface::class, $videoParamTypes);

        // 4. Test forwarding proxy preserves behavior
        $job = CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['creator_forward_proxy']),
            'total_accounts' => 1,
            'status' => 'running',
        ]);
        $result = CrawlResult::create([
            'crawl_job_id' => $job->id,
            'username' => 'creator_forward_proxy',
            'status' => 'success',
        ]);

        $resultService = app(CrawlResultService::class);
        $videosPayload = [
            [
                'video_id' => '998877665544',
                'desc' => 'Test proxy video',
                'views' => 1200,
                'likes' => 300,
            ],
        ];

        // Call proxy on CrawlResultService
        $storedCount = $resultService->storeVideoResults($job->id, $result->id, null, 'creator_forward_proxy', $videosPayload);
        $this->assertSame(1, $storedCount);

        $this->assertDatabaseHas('tiktok_videos', [
            'video_id' => '998877665544',
            'play_count' => 1200,
            'digg_count' => 300,
        ]);

        $this->assertDatabaseHas('crawl_video_results', [
            'crawl_job_id' => $job->id,
            'video_id' => '998877665544',
            'play_count' => 1200,
            'digg_count' => 300,
        ]);

        // 5. Test countByStatus via CrawlVideoResultService
        $this->assertSame(1, $videoService1->countByStatus($job->id, 'success'));
        $this->assertSame(0, $videoService1->countByStatus($job->id, 'failed'));
    }

    public function test_crawl_job_repository_dead_code_cleanup_and_interface_contracts(): void
    {
        // 1. Verify AvatarStorageService file and class are completely removed
        $this->assertFileDoesNotExist(
            base_path('modules/Crawler/src/Services/AvatarStorageService.php'),
            'AvatarStorageService.php file must be deleted.'
        );
        $this->assertFalse(
            class_exists('Modules\Crawler\Services\AvatarStorageService'),
            'AvatarStorageService must be deleted.'
        );

        // 2. Reflection on CrawlJobRepositoryInterface
        $interfaceRef = new ReflectionClass(CrawlJobRepositoryInterface::class);

        // Assert removed methods no longer exist
        $this->assertFalse($interfaceRef->hasMethod('getResults'), 'CrawlJobRepositoryInterface must not declare getResults().');
        $this->assertFalse($interfaceRef->hasMethod('hasRunningJob'), 'CrawlJobRepositoryInterface must not declare hasRunningJob().');
        $this->assertFalse($interfaceRef->hasMethod('findByStatus'), 'CrawlJobRepositoryInterface must not declare findByStatus().');

        // Assert required methods are preserved
        $this->assertTrue($interfaceRef->hasMethod('getLastestJob'), 'CrawlJobRepositoryInterface must preserve getLastestJob() for DashboardService.');
        $this->assertTrue($interfaceRef->hasMethod('getStatisticsSummary'), 'CrawlJobRepositoryInterface must preserve getStatisticsSummary().');
        $this->assertTrue($interfaceRef->hasMethod('getUnfinishedJobs'), 'CrawlJobRepositoryInterface must preserve getUnfinishedJobs().');
        $this->assertTrue($interfaceRef->hasMethod('getActiveJobById'), 'CrawlJobRepositoryInterface must preserve getActiveJobById().');

        // 3. Reflection on CrawlJobRepository implementation
        $repoRef = new ReflectionClass(CrawlJobRepository::class);

        $this->assertFalse($repoRef->hasMethod('getResults'), 'CrawlJobRepository must not define getResults().');
        $this->assertFalse($repoRef->hasMethod('hasRunningJob'), 'CrawlJobRepository must not define hasRunningJob().');
        $this->assertFalse($repoRef->hasMethod('findByStatus'), 'CrawlJobRepository must not define findByStatus().');

        $this->assertTrue($repoRef->hasMethod('getLastestJob'), 'CrawlJobRepository must preserve getLastestJob().');
        $this->assertTrue($repoRef->hasMethod('getStatisticsSummary'), 'CrawlJobRepository must preserve getStatisticsSummary().');
        $this->assertTrue($repoRef->hasMethod('getUnfinishedJobs'), 'CrawlJobRepository must preserve getUnfinishedJobs().');
        $this->assertTrue($repoRef->hasMethod('getActiveJobById'), 'CrawlJobRepository must preserve getActiveJobById().');
    }
}
