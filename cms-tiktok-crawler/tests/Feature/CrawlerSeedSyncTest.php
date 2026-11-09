<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TiktokAccount\Models\TiktokAccount;
use Tests\TestCase;

class CrawlerSeedSyncTest extends TestCase
{
    use RefreshDatabase;

    private string $crawlerToken = '2703ac97eb897aacbf1235f5e608bf93d2ca7e0c2fe9d09a35e44f6ad6ab410c';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.crawler.token' => $this->crawlerToken]);
    }

    public function test_tiktok_account_lifecycle_records_seed_changes_monotonically(): void
    {
        // 1. Create account -> 'insert'
        $account = TiktokAccount::create([
            'username' => 'seed_tester',
            'sec_uid' => 'MS4wLjAB_TEST_01',
            'nickname' => 'Tester One',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('crawler_seed_sequence', [
            'id' => 1,
            'last_sequence' => 1,
        ]);

        $this->assertDatabaseHas('crawler_seed_changes', [
            'sequence_id' => 1,
            'account_id' => $account->id,
            'operation' => 'insert',
        ]);

        // 2. Update status to inactive -> 'disable'
        $account->update(['status' => 'inactive']);

        $this->assertDatabaseHas('crawler_seed_sequence', [
            'id' => 1,
            'last_sequence' => 2,
        ]);

        $this->assertDatabaseHas('crawler_seed_changes', [
            'sequence_id' => 2,
            'account_id' => $account->id,
            'operation' => 'disable',
        ]);

        // 3. Delete account -> 'delete'
        $account->delete();

        $this->assertDatabaseHas('crawler_seed_sequence', [
            'id' => 1,
            'last_sequence' => 3,
        ]);

        $this->assertDatabaseHas('crawler_seed_changes', [
            'sequence_id' => 3,
            'account_id' => $account->id,
            'operation' => 'delete',
        ]);
    }

    public function test_api_public_crawler_seeds_changes_pagination(): void
    {
        // Create 3 accounts
        $acc1 = TiktokAccount::create(['username' => 'user_one', 'sec_uid' => 'sec_1', 'status' => 'active']);
        $acc2 = TiktokAccount::create(['username' => 'user_two', 'sec_uid' => 'sec_2', 'status' => 'active']);
        $acc3 = TiktokAccount::create(['username' => 'user_three', 'sec_uid' => 'sec_3', 'status' => 'active']);

        // Query page 1 (limit 2)
        $response = $this->withToken($this->crawlerToken)
            ->getJson('/admin/api/public/crawler/seeds/changes?since_sequence=0&limit=2');

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'success');
        $response->assertJsonPath('data.latest_sequence', 3);
        $response->assertJsonPath('data.count', 2);
        $response->assertJsonPath('data.has_more', true);

        $changes = $response->json('data.changes');
        $this->assertCount(2, $changes);
        $this->assertEquals(1, $changes[0]['sequence_id']);
        $this->assertEquals('user_one', $changes[0]['payload']['username']);
        $this->assertEquals(2, $changes[1]['sequence_id']);

        // Query page 2 (since_sequence 2)
        $response2 = $this->withToken($this->crawlerToken)
            ->getJson('/admin/api/public/crawler/seeds/changes?since_sequence=2&limit=2');

        $response2->assertStatus(200);
        $response2->assertJsonPath('status', 'success');
        $response2->assertJsonPath('data.count', 1);
        $response2->assertJsonPath('data.has_more', false);

        $changes2 = $response2->json('data.changes');
        $this->assertCount(1, $changes2);
        $this->assertEquals(3, $changes2[0]['sequence_id']);
        $this->assertEquals('user_three', $changes2[0]['payload']['username']);
    }

    public function test_api_public_crawler_seeds_changes_unauthorized(): void
    {
        $response = $this->getJson('/admin/api/public/crawler/seeds/changes');
        $response->assertStatus(401);
    }
}
