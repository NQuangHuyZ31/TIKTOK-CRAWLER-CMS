<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Crawler\Services\CrawlerWebhookIngestionService;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Models\TiktokVideo;
use Tests\TestCase;

class CrawlerBatchWebhookTest extends TestCase
{
    use RefreshDatabase;

    private string $endpoint = '/admin/api/public/crawler/webhook/batch';

    public function test_ingests_batch_webhook_with_accounts_and_videos(): void
    {
        $events = [];
        $runId = 'run_batch3_001';

        // 5 Account events
        for ($i = 1; $i <= 5; $i++) {
            $username = "creator_alpha_{$i}";
            $payload = [
                'username' => $username,
                'sec_uid' => "MS4wLjABAAAA_alpha_{$i}",
                'nickname' => "Alpha Creator {$i}",
                'follower_count' => 10000 * $i,
                'following_count' => 50,
                'heart_count' => 50000 * $i,
                'video_count' => 10,
                'is_verified' => true,
            ];
            $payloadHash = CrawlerWebhookIngestionService::computePayloadHash($payload);
            $eventRecord = [
                'crawl_run_id' => $runId,
                'entity_key' => $username,
                'entity_revision' => 1,
                'entity_type' => 'account',
                'observed_at' => '2026-11-05T12:00:00.000000Z',
                'operation' => 'upsert',
                'schema_version' => '1.0',
            ];
            $eventId = CrawlerWebhookIngestionService::computeEventId($eventRecord, $payloadHash);

            $events[] = array_merge($eventRecord, [
                'event_id' => $eventId,
                'logical_event_key' => "account:{$username}",
                'payload_hash' => $payloadHash,
                'payload' => $payload,
            ]);
        }

        // 5 Video events
        for ($i = 1; $i <= 5; $i++) {
            $videoId = "730000000000000000{$i}";
            $username = "creator_alpha_{$i}";
            $payload = [
                'video_id' => $videoId,
                'username' => $username,
                'play_count' => 50000 * $i,
                'digg_count' => 2500 * $i,
                'comment_count' => 100,
                'share_count' => 50,
                'caption' => "Amazing video #{$i} by @{$username}",
                'music_author' => "Artist {$i}",
            ];
            $payloadHash = CrawlerWebhookIngestionService::computePayloadHash($payload);
            $eventRecord = [
                'crawl_run_id' => $runId,
                'entity_key' => $videoId,
                'entity_revision' => 1,
                'entity_type' => 'video',
                'observed_at' => '2026-11-05T12:00:00.000000Z',
                'operation' => 'upsert',
                'schema_version' => '1.0',
            ];
            $eventId = CrawlerWebhookIngestionService::computeEventId($eventRecord, $payloadHash);

            $events[] = array_merge($eventRecord, [
                'event_id' => $eventId,
                'logical_event_key' => "video:{$videoId}",
                'payload_hash' => $payloadHash,
                'payload' => $payload,
            ]);
        }

        $batchPayload = [
            'batch_id' => 'batch_v3_test_01',
            'crawl_run_id' => $runId,
            'events_count' => count($events),
            'events' => $events,
        ];

        $response = $this->postJson($this->endpoint, $batchPayload);

        $response->assertStatus(200);
        $response->assertJson([
            'batch_id' => 'batch_v3_test_01',
            'status' => 'delivered',
            'retryable_event_ids' => [],
            'rejected_event_ids' => [],
        ]);
        $this->assertCount(10, $response->json('acknowledged_event_ids'));

        // Verify Database Persistence
        $this->assertDatabaseCount('crawler_event_receipts', 10);
        $this->assertDatabaseCount('tiktok_accounts', 5);
        $this->assertDatabaseCount('tiktok_videos', 5);
        $this->assertDatabaseCount('crawl_run_account_snapshots', 5);
        $this->assertDatabaseCount('crawl_run_video_snapshots', 5);
    }

    public function test_duplicate_webhook_is_idempotent_no_op(): void
    {
        $payload = [
            'username' => 'idempotent_user',
            'follower_count' => 999,
        ];
        $payloadHash = CrawlerWebhookIngestionService::computePayloadHash($payload);
        $eventRecord = [
            'crawl_run_id' => 'run_idem_01',
            'entity_key' => 'idempotent_user',
            'entity_revision' => 1,
            'entity_type' => 'account',
            'observed_at' => '2026-11-05T12:00:00.000000Z',
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $eventId = CrawlerWebhookIngestionService::computeEventId($eventRecord, $payloadHash);

        $batchPayload = [
            'batch_id' => 'batch_idem_01',
            'events' => [
                array_merge($eventRecord, [
                    'event_id' => $eventId,
                    'logical_event_key' => 'account:idempotent_user',
                    'payload_hash' => $payloadHash,
                    'payload' => $payload,
                ]),
            ],
        ];

        // First delivery
        $res1 = $this->postJson($this->endpoint, $batchPayload);
        $res1->assertStatus(200);
        $res1->assertJson(['status' => 'delivered']);
        $this->assertDatabaseCount('tiktok_accounts', 1);
        $this->assertDatabaseCount('crawler_event_receipts', 1);

        // Second delivery (simulating network timeout retry)
        $res2 = $this->postJson($this->endpoint, $batchPayload);
        $res2->assertStatus(200);
        $res2->assertJson([
            'status' => 'delivered',
            'acknowledged_event_ids' => [$eventId],
        ]);

        // Must still have exactly 1 record, not duplicated
        $this->assertDatabaseCount('tiktok_accounts', 1);
        $this->assertDatabaseCount('crawler_event_receipts', 1);
    }

    public function test_rejects_event_with_integrity_conflict(): void
    {
        $payload1 = ['username' => 'conflict_user', 'follower_count' => 100];
        $payloadHash1 = CrawlerWebhookIngestionService::computePayloadHash($payload1);
        $eventRecord = [
            'crawl_run_id' => 'run_conflict_01',
            'entity_key' => 'conflict_user',
            'entity_revision' => 1,
            'entity_type' => 'account',
            'observed_at' => '2026-11-05T12:00:00.000000Z',
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $eventId = CrawlerWebhookIngestionService::computeEventId($eventRecord, $payloadHash1);

        // Delivery 1
        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_conflict_01',
            'events' => [
                array_merge($eventRecord, [
                    'event_id' => $eventId,
                    'payload_hash' => $payloadHash1,
                    'payload' => $payload1,
                ]),
            ],
        ])->assertStatus(200);

        // Simulate a corrupted or conflicting receipt in the database
        DB::table('crawler_event_receipts')
            ->where('event_id', $eventId)
            ->update(['payload_hash' => 'tampered_or_conflicting_hash_000000000000000000000000000000000000']);

        // Delivery 2 with valid event_id & payload1, but DB receipt now has conflicting hash
        $res2 = $this->postJson($this->endpoint, [
            'batch_id' => 'batch_conflict_02',
            'events' => [
                array_merge($eventRecord, [
                    'event_id' => $eventId,
                    'payload_hash' => $payloadHash1,
                    'payload' => $payload1,
                ]),
            ],
        ]);

        $res2->assertStatus(200);
        $res2->assertJson([
            'status' => 'partially_delivered',
            'acknowledged_event_ids' => [],
            'rejected_event_ids' => [$eventId],
        ]);
        $this->assertEquals('INTEGRITY_CONFLICT', $res2->json("errors.{$eventId}.error_code"));
    }

    public function test_observed_at_chronological_guard_prevents_stale_metrics_overwrite(): void
    {
        $username = 'chrono_user';
        $run1 = 'run_chrono_01';
        $run2 = 'run_chrono_02';

        // 1. New event (T_now): 50,000 followers observed at 12:00
        $payloadNew = ['username' => $username, 'follower_count' => 50000];
        $hashNew = CrawlerWebhookIngestionService::computePayloadHash($payloadNew);
        $recordNew = [
            'crawl_run_id' => $run1,
            'entity_key' => $username,
            'entity_revision' => 1,
            'entity_type' => 'account',
            'observed_at' => '2026-11-05T12:00:00.000000Z',
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $idNew = CrawlerWebhookIngestionService::computeEventId($recordNew, $hashNew);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_chrono_01',
            'events' => [
                array_merge($recordNew, ['event_id' => $idNew, 'payload_hash' => $hashNew, 'payload' => $payloadNew]),
            ],
        ])->assertStatus(200)->assertJson(['status' => 'delivered']);

        $account = TiktokAccount::where('username', $username)->first();
        $this->assertNotNull($account);
        $this->assertEquals(50000, $account->followers_count);

        // 2. Older event arrives later (T_past): 10,000 followers observed at 08:00
        $payloadOld = ['username' => $username, 'follower_count' => 10000];
        $hashOld = CrawlerWebhookIngestionService::computePayloadHash($payloadOld);
        $recordOld = [
            'crawl_run_id' => $run2,
            'entity_key' => $username,
            'entity_revision' => 1,
            'entity_type' => 'account',
            'observed_at' => '2026-11-05T08:00:00.000000Z', // 4 hours earlier
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $idOld = CrawlerWebhookIngestionService::computeEventId($recordOld, $hashOld);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_chrono_02',
            'events' => [
                array_merge($recordOld, ['event_id' => $idOld, 'payload_hash' => $hashOld, 'payload' => $payloadOld]),
            ],
        ])->assertStatus(200)->assertJson(['status' => 'delivered']);

        // Master metrics MUST NOT be overwritten with the older 10,000
        $account->refresh();
        $this->assertEquals(50000, $account->followers_count);

        // BUT both snapshots must be persisted in crawl_run_account_snapshots with their respective historical values
        $snapNew = DB::table('crawl_run_account_snapshots')->where('crawl_run_id', $run1)->first();
        $this->assertNotNull($snapNew);
        $this->assertEquals(50000, $snapNew->follower_count);

        $snapOld = DB::table('crawl_run_account_snapshots')->where('crawl_run_id', $run2)->first();
        $this->assertNotNull($snapOld);
        $this->assertEquals(10000, $snapOld->follower_count);
    }

    public function test_tie_break_with_entity_revision_on_identical_observed_at(): void
    {
        $username = 'tiebreak_user';
        $timestamp = '2026-11-05T12:00:00.000000Z';

        // Revision 1: 50,000 followers
        $p1 = ['username' => $username, 'follower_count' => 50000];
        $h1 = CrawlerWebhookIngestionService::computePayloadHash($p1);
        $r1 = [
            'crawl_run_id' => 'run_tie_01',
            'entity_key' => $username,
            'entity_revision' => 1,
            'entity_type' => 'account',
            'observed_at' => $timestamp,
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $id1 = CrawlerWebhookIngestionService::computeEventId($r1, $h1);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_tie_01',
            'events' => [array_merge($r1, ['event_id' => $id1, 'payload_hash' => $h1, 'payload' => $p1])],
        ])->assertStatus(200);

        // Revision 2 with identical timestamp: 55,000 followers
        $p2 = ['username' => $username, 'follower_count' => 55000];
        $h2 = CrawlerWebhookIngestionService::computePayloadHash($p2);
        $r2 = [
            'crawl_run_id' => 'run_tie_02',
            'entity_key' => $username,
            'entity_revision' => 2,
            'entity_type' => 'account',
            'observed_at' => $timestamp,
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $id2 = CrawlerWebhookIngestionService::computeEventId($r2, $h2);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_tie_02',
            'events' => [array_merge($r2, ['event_id' => $id2, 'payload_hash' => $h2, 'payload' => $p2])],
        ])->assertStatus(200);

        $account = TiktokAccount::where('username', $username)->first();
        $this->assertEquals(55000, $account->followers_count);
        $this->assertEquals(2, $account->last_entity_revision);
    }

    public function test_video_master_upsert_and_snapshot_persistence(): void
    {
        $username = 'video_creator';
        $videoId = '740000000000000001';

        // 1. Create account first
        $account = TiktokAccount::create(['username' => $username]);

        // 2. Ingest newer video event (500,000 plays)
        $payloadNew = [
            'video_id' => $videoId,
            'username' => $username,
            'play_count' => 500000,
            'digg_count' => 25000,
            'comment_count' => 1200,
            'share_count' => 300,
            'caption' => 'Master video caption',
        ];
        $hNew = CrawlerWebhookIngestionService::computePayloadHash($payloadNew);
        $rNew = [
            'crawl_run_id' => 'run_vid_01',
            'entity_key' => $videoId,
            'entity_revision' => 1,
            'entity_type' => 'video',
            'observed_at' => '2026-11-05T15:00:00.000000Z',
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $idNew = CrawlerWebhookIngestionService::computeEventId($rNew, $hNew);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_vid_01',
            'events' => [array_merge($rNew, ['event_id' => $idNew, 'payload_hash' => $hNew, 'payload' => $payloadNew])],
        ])->assertStatus(200);

        $video = TiktokVideo::where('video_id', $videoId)->first();
        $this->assertNotNull($video);
        $this->assertEquals(500000, $video->play_count);
        $this->assertEquals($account->id, $video->tiktok_account_id);

        // 3. Ingest older video event (100,000 plays observed at 10:00)
        $payloadOld = [
            'video_id' => $videoId,
            'username' => $username,
            'play_count' => 100000,
        ];
        $hOld = CrawlerWebhookIngestionService::computePayloadHash($payloadOld);
        $rOld = [
            'crawl_run_id' => 'run_vid_02',
            'entity_key' => $videoId,
            'entity_revision' => 1,
            'entity_type' => 'video',
            'observed_at' => '2026-11-05T10:00:00.000000Z',
            'operation' => 'upsert',
            'schema_version' => '1.0',
        ];
        $idOld = CrawlerWebhookIngestionService::computeEventId($rOld, $hOld);

        $this->postJson($this->endpoint, [
            'batch_id' => 'batch_vid_02',
            'events' => [array_merge($rOld, ['event_id' => $idOld, 'payload_hash' => $hOld, 'payload' => $payloadOld])],
        ])->assertStatus(200);

        // Master video plays MUST remain 500,000
        $video->refresh();
        $this->assertEquals(500000, $video->play_count);

        // Snapshots must record both historical observations
        $this->assertDatabaseCount('crawl_run_video_snapshots', 2);
    }

    public function test_deadlock_retry_recovers_and_acknowledges_event(): void
    {
        $attempts = 0;
        CrawlerWebhookIngestionService::setTestingExecutionHook(function () use (&$attempts) {
            $attempts++;
            if ($attempts === 1) {
                // Simulate deadlock on 1st attempt
                throw new \Exception('SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock', 1213);
            }
        });

        try {
            $payload = ['username' => 'deadlock_recover_user', 'follower_count' => 300];
            $hash = CrawlerWebhookIngestionService::computePayloadHash($payload);
            $record = [
                'crawl_run_id' => 'run_dl_01',
                'entity_key' => 'deadlock_recover_user',
                'entity_revision' => 1,
                'entity_type' => 'account',
                'observed_at' => '2026-11-05T12:00:00.000000Z',
                'operation' => 'upsert',
                'schema_version' => '1.0',
            ];
            $id = CrawlerWebhookIngestionService::computeEventId($record, $hash);

            $res = $this->postJson($this->endpoint, [
                'batch_id' => 'batch_dl_01',
                'events' => [array_merge($record, ['event_id' => $id, 'payload_hash' => $hash, 'payload' => $payload])],
            ]);

            $res->assertStatus(200);
            $res->assertJson([
                'status' => 'delivered',
                'acknowledged_event_ids' => [$id],
            ]);

            $this->assertEquals(2, $attempts);
        } finally {
            CrawlerWebhookIngestionService::setTestingExecutionHook(null);
        }
    }

    public function test_deadlock_exhaustion_returns_retryable_event(): void
    {
        CrawlerWebhookIngestionService::setTestingExecutionHook(function () {
            // Always throw deadlock
            throw new \Exception('SQLSTATE[40001]: Serialization failure: 1213 Deadlock found when trying to get lock', 1213);
        });

        try {
            $payload = ['username' => 'deadlock_exhaust_user', 'follower_count' => 300];
            $hash = CrawlerWebhookIngestionService::computePayloadHash($payload);
            $record = [
                'crawl_run_id' => 'run_dl_02',
                'entity_key' => 'deadlock_exhaust_user',
                'entity_revision' => 1,
                'entity_type' => 'account',
                'observed_at' => '2026-11-05T12:00:00.000000Z',
                'operation' => 'upsert',
                'schema_version' => '1.0',
            ];
            $id = CrawlerWebhookIngestionService::computeEventId($record, $hash);

            $res = $this->postJson($this->endpoint, [
                'batch_id' => 'batch_dl_02',
                'events' => [array_merge($record, ['event_id' => $id, 'payload_hash' => $hash, 'payload' => $payload])],
            ]);

            $res->assertStatus(200);
            $res->assertJson([
                'status' => 'partially_delivered',
                'retryable_event_ids' => [$id],
                'rejected_event_ids' => [],
            ]);
            $this->assertEquals('DEADLOCK_MAX_RETRIES_EXCEEDED', $res->json("errors.{$id}.error_code"));
        } finally {
            CrawlerWebhookIngestionService::setTestingExecutionHook(null);
        }
    }
}
