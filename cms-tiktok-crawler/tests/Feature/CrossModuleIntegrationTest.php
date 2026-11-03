<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\Core\Support\ModuleRegistry;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;
use Modules\Role\Repositories\Interfaces\RoleRepositoryInterface;
use Modules\System\Repositories\Interfaces\ActivityLogRepositoryInterface;
use Modules\System\Repositories\Interfaces\LoginLogRepositoryInterface;
use Modules\System\Repositories\Interfaces\SystemSettingRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Tests\TestCase;

class CrossModuleIntegrationTest extends TestCase
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
     * 1. Test that all module repository interfaces resolve correctly from the service container.
     */
    public function test_all_module_repository_interfaces_are_bound_in_container(): void
    {
        $interfaces = [
            AuthRepositoryInterface::class,
            PermissionRepositoryInterface::class,
            RoleRepositoryInterface::class,
            UserRepositoryInterface::class,
            TiktokAccountRepositoryInterface::class,
            TiktokVideoRepositoryInterface::class,
            CrawlJobRepositoryInterface::class,
            CrawlResultRepositoryInterface::class,
            CrawlVideoResultRepositoryInterface::class,
            ActivityLogRepositoryInterface::class,
            LoginLogRepositoryInterface::class,
            SystemSettingRepositoryInterface::class,
        ];

        foreach ($interfaces as $interface) {
            $instance = app($interface);
            $this->assertNotNull($instance, "Interface {$interface} failed to resolve from container.");
            $this->assertInstanceOf($interface, $instance);
        }
    }

    /**
     * 2. Test that ModuleRegistry correctly provides asset entrypoints for all modules.
     */
    public function test_module_registry_entrypoints_for_all_modules(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);
        $entrypoints = $registry->getEntrypoints();

        $this->assertIsArray($entrypoints);
        $expectedModules = ['Core', 'Auth', 'Crawler', 'Permission', 'Role', 'System', 'TiktokAccount', 'User'];

        foreach ($expectedModules as $mod) {
            $this->assertArrayHasKey($mod, $entrypoints, "Module {$mod} missing in entrypoints manifest.");
        }
    }

    /**
     * 3. Test end-to-end cross-module workflow:
     *    Auth -> Crawler Job -> Webhook -> TiktokAccount update -> Audit log.
     */
    public function test_end_to_end_cross_module_crawl_and_account_workflow(): void
    {
        $token = $this->adminUser->createToken('test-token')->plainTextToken;

        // 1. Create a crawl job via Crawler API
        $createJobRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson($this->apiUri('crawler/crawl-job'), [
                'source_type' => 'usernames',
                'crawl_mode' => 'account_with_videos',
                'max_videos_per_account' => 5,
                'data_crawl' => ['e2e_creator'],
            ]);

        $createJobRes->assertStatus(201);
        $jobId = $createJobRes->json('data.id');
        $this->assertNotNull($jobId);

        // 2. Python Crawler simulates sending 'started' webhook event via API module
        $startedRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$jobId}/events"), [
            'event' => 'started',
            'job_id' => $jobId,
            'status' => 'running',
            'worker_id' => 'worker-node-1',
        ]);
        $startedRes->assertStatus(200);

        // 3. Webhook sends crawled account data with video
        $accountWebhookRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$jobId}/events"), [
            'event' => 'account',
            'job_id' => $jobId,
            'status' => 'success',
            'account' => [
                'username' => 'e2e_creator',
                'nickname' => 'E2E Creator Nick',
                'followers' => 125000,
                'following' => 300,
                'likes' => 2500000,
                'video_count' => 45,
            ],
            'videos' => [
                [
                    'video_id' => 'vid_e2e_9999',
                    'video_url' => 'https://www.tiktok.com/@e2e_creator/video/vid_e2e_9999',
                    'description' => 'E2E Test Video Description',
                    'play_count' => 50000,
                    'digg_count' => 4500,
                    'comment_count' => 120,
                    'share_count' => 60,
                ],
            ],
        ]);
        $accountWebhookRes->assertStatus(201);

        // 4. Verify TiktokAccount module has the updated account and video
        /** @var TiktokAccountRepositoryInterface $accountRepo */
        $accountRepo = app(TiktokAccountRepositoryInterface::class);
        $account = $accountRepo->getAccountByField('username', 'e2e_creator');
        $this->assertNotNull($account);
        $this->assertEquals(125000, $account->followers_count);
        $this->assertEquals(2500000, $account->likes_count);

        /** @var TiktokVideoRepositoryInterface $videoRepo */
        $videoRepo = app(TiktokVideoRepositoryInterface::class);
        $videos = $videoRepo->getExistingByVideoIds(['vid_e2e_9999']);
        $this->assertCount(1, $videos);
        $this->assertEquals(50000, $videos->first()->play_count);

        // 5. Webhook sends 'completed' event
        $completeRes = $this->postJson($this->apiUri("public/crawler/crawl-jobs/{$jobId}/events"), [
            'event' => 'completed',
            'job_id' => $jobId,
            'status' => 'completed',
            'total_accounts' => 1,
            'success_count' => 1,
            'failed_count' => 0,
        ]);
        $completeRes->assertStatus(200);

        // 6. Verify Crawler job is marked as completed
        /** @var CrawlJobRepositoryInterface $jobRepo */
        $jobRepo = app(CrawlJobRepositoryInterface::class);
        /** @var CrawlJob $job */
        $job = $jobRepo->findById($jobId);
        $this->assertEquals('completed', $job->status);
        $this->assertEquals(1, $job->success_count);
        $this->assertEquals(0, $job->failed_count);
    }
}
