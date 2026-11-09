<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Crawler\Services\CrawlerEngineClient;
use Modules\Crawler\Services\CrawlerPrivacyService;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class CrawlerPrivacySagaTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_immediate_suppression_and_successful_purge(): void
    {
        $mockClient = Mockery::mock(CrawlerEngineClient::class);
        $mockClient->shouldReceive('purgePrivacyEntity')
            ->once()
            ->with('username', 'vietphuongthoa98', Mockery::type('string'), 'gdpr_opt_out')
            ->andReturn(['success' => true]);

        $service = new CrawlerPrivacyService($mockClient);

        $result = $service->requestPurge('username', '@vietphuongthoa98', 'gdpr_opt_out');

        $this->assertEquals('completed', $result['status']);
        $this->assertEquals('vietphuongthoa98', $result['entity_key']);

        // Assert record in crawler_privacy_suppressions
        $this->assertDatabaseHas('crawler_privacy_suppressions', [
            'entity_type' => 'username',
            'entity_key' => 'vietphuongthoa98',
            'reason' => 'gdpr_opt_out',
        ]);

        // Assert record in crawler_privacy_purge_requests
        $this->assertDatabaseHas('crawler_privacy_purge_requests', [
            'purge_request_id' => $result['purge_request_id'],
            'entity_type' => 'username',
            'entity_key' => 'vietphuongthoa98',
            'status' => 'completed',
        ]);

        $this->assertTrue($service->isSuppressed('username', 'vietphuongthoa98'));
        $this->assertTrue($service->isSuppressed('username', '@vietphuongthoa98'));
    }

    public function test_t21_privacy_saga_retry_when_crawler_engine_down(): void
    {
        $mockClient = Mockery::mock(CrawlerEngineClient::class);
        $mockClient->shouldReceive('purgePrivacyEntity')
            ->once()
            ->andThrow(new RuntimeException('Connection refused: crawler service is down'));

        $service = new CrawlerPrivacyService($mockClient);

        // Request purge while python engine is down
        $result = $service->requestPurge('username', 'linhbarbie', 'account_deletion');

        // T21: Must mark status as pending_retry and record error
        $this->assertEquals('pending_retry', $result['status']);

        // Downstream suppression MUST still be active immediately
        $this->assertDatabaseHas('crawler_privacy_suppressions', [
            'entity_type' => 'username',
            'entity_key' => 'linhbarbie',
        ]);
        $this->assertTrue($service->isSuppressed('username', 'linhbarbie'));

        $this->assertDatabaseHas('crawler_privacy_purge_requests', [
            'purge_request_id' => $result['purge_request_id'],
            'status' => 'pending_retry',
        ]);

        // Now python service recovers and acknowledges retry
        $mockClientRetry = Mockery::mock(CrawlerEngineClient::class);
        $mockClientRetry->shouldReceive('purgePrivacyEntity')
            ->once()
            ->with('username', 'linhbarbie', $result['purge_request_id'])
            ->andReturn(['success' => true]);

        $serviceRetry = new CrawlerPrivacyService($mockClientRetry);
        $retriedCount = $serviceRetry->retryPendingPurges();

        $this->assertEquals(1, $retriedCount);
        $this->assertDatabaseHas('crawler_privacy_purge_requests', [
            'purge_request_id' => $result['purge_request_id'],
            'status' => 'completed',
        ]);
    }
}
