<?php

namespace Modules\Crawler\Services;

use DateTimeInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Models\TiktokVideo;
use Throwable;

class CrawlerWebhookIngestionService
{
    /**
     * Maximum retry attempts for InnoDB deadlock per event.
     */
    private const MAX_DEADLOCK_RETRIES = 3;

    /**
     * Optional testing hook for simulating database deadlocks or faults.
     * @var callable|null
     */
    protected static $testingExecutionHook = null;

    public static function setTestingExecutionHook(?callable $hook): void
    {
        self::$testingExecutionHook = $hook;
    }

    /**
     * Check if the exception represents a database deadlock or lock wait timeout.
     */
    public static function isDeadlockException(Throwable $e): bool
    {
        $code = (int) $e->getCode();
        $msg = $e->getMessage();

        return $code === 1213
            || $code === 1205
            || str_contains($msg, '1213')
            || str_contains($msg, 'Deadlock')
            || str_contains($msg, '1205')
            || str_contains($msg, 'Lock wait timeout')
            || str_contains($msg, '40001');
    }

    /**
     * Process an incoming batch webhook adhering to the v2.2 specification.
     * Evaluates HMAC authentication, canonical RFC 8785 hashes, idempotent receipts,
     * per-event transaction isolation, master data upsert with observed_at protection,
     * and historical snapshots.
     */
    public function handleBatchWebhook(Request $request): array
    {
        $rawBody = $request->getContent();
        $payload = json_decode($rawBody, true);

        if (!is_array($payload) || !isset($payload['batch_id']) || !isset($payload['events'])) {
            return [
                'status_code' => 400,
                'body' => [
                    'error_code' => 'INVALID_PAYLOAD',
                    'error_message' => 'Malformed batch payload envelope. Expected batch_id and events array.',
                ],
            ];
        }

        // Verify HMAC signature if signature headers are provided
        if (!$this->verifyHmacSignature($request, $rawBody)) {
            return [
                'status_code' => 401,
                'body' => [
                    'error_code' => 'UNAUTHORIZED_SIGNATURE',
                    'error_message' => 'HMAC signature verification failed.',
                ],
            ];
        }

        $batchId = (string) $payload['batch_id'];
        $events = (array) $payload['events'];

        $acknowledgedEventIds = [];
        $retryableEventIds = [];
        $rejectedEventIds = [];
        $errors = [];

        foreach ($events as $event) {
            $eventId = (string) ($event['event_id'] ?? '');

            if ($eventId === '') {
                $rejectedEventIds[] = 'unknown_event';
                $errors['unknown_event'] = [
                    'error_code' => 'MISSING_EVENT_ID',
                    'error_message' => 'Event record missing event_id.',
                ];
                continue;
            }

            $result = $this->processSingleEventWithRetry($event);

            if ($result['status'] === 'acknowledged') {
                $acknowledgedEventIds[] = $eventId;
            } elseif ($result['status'] === 'retryable') {
                $retryableEventIds[] = $eventId;
                if (!empty($result['error'])) {
                    $errors[$eventId] = $result['error'];
                }
            } else {
                $rejectedEventIds[] = $eventId;
                if (!empty($result['error'])) {
                    $errors[$eventId] = $result['error'];
                }
            }
        }

        $overallStatus = (count($retryableEventIds) > 0 || count($rejectedEventIds) > 0)
            ? 'partially_delivered'
            : 'delivered';

        return [
            'status_code' => 200,
            'body' => [
                'batch_id' => $batchId,
                'status' => $overallStatus,
                'acknowledged_event_ids' => $acknowledgedEventIds,
                'retryable_event_ids' => $retryableEventIds,
                'rejected_event_ids' => $rejectedEventIds,
                'errors' => $errors,
            ],
        ];
    }

    /**
     * Process a single event wrapped in its own independent database transaction,
     * retrying automatically upon MySQL Deadlock (Error 1213 / 40001).
     */
    protected function processSingleEventWithRetry(array $event): array
    {
        $eventId = (string) $event['event_id'];
        $suppliedPayloadHash = (string) ($event['payload_hash'] ?? '');
        $payloadData = (array) ($event['payload'] ?? []);

        // 1. Locally compute canonical payload hash adhering to RFC 8785 JCS
        $calculatedPayloadHash = self::computePayloadHash($payloadData);
        if ($calculatedPayloadHash !== $suppliedPayloadHash) {
            return [
                'status' => 'rejected',
                'error' => [
                    'error_code' => 'HASH_MISMATCH',
                    'error_message' => 'Locally calculated payload hash does not match supplied payload_hash.',
                ],
            ];
        }

        // 2. Validate canonical event_id computation
        $calculatedEventId = self::computeEventId($event, $calculatedPayloadHash);
        if ($calculatedEventId !== $eventId) {
            return [
                'status' => 'rejected',
                'error' => [
                    'error_code' => 'EVENT_ID_MISMATCH',
                    'error_message' => 'Supplied event_id does not match calculated canonical envelope hash.',
                ],
            ];
        }

        // 3. Independent transaction per event with deadlock retry
        $attempts = 0;
        while ($attempts < self::MAX_DEADLOCK_RETRIES) {
            $attempts++;
            try {
                return $this->executeEventTransaction($event, $eventId, $calculatedPayloadHash);
            } catch (Throwable $e) {
                $isDeadlock = self::isDeadlockException($e);

                if ($isDeadlock && $attempts < self::MAX_DEADLOCK_RETRIES) {
                    $jitter = random_int(1000, 20000); // 1ms - 20ms jitter
                    usleep((30000 * $attempts) + $jitter);
                    continue;
                }

                if ($isDeadlock) {
                    return [
                        'status' => 'retryable',
                        'error' => [
                            'error_code' => 'DEADLOCK_MAX_RETRIES_EXCEEDED',
                            'error_message' => $e->getMessage(),
                        ],
                    ];
                }

                // Check for duplicate receipt constraint violation (Error 1062)
                if (str_contains($msg, '1062') || str_contains($msg, 'Duplicate entry')) {
                    return $this->handleDuplicateReceipt($eventId, $calculatedPayloadHash);
                }

                Log::error("Failed to ingest crawler event {$eventId}: " . $e->getMessage(), [
                    'exception' => $e,
                    'event' => $event,
                ]);

                return [
                    'status' => 'rejected',
                    'error' => [
                        'error_code' => 'INGESTION_ERROR',
                        'error_message' => $e->getMessage(),
                    ],
                ];
            }
        }

        return [
            'status' => 'retryable',
            'error' => [
                'error_code' => 'EXHAUSTED_RETRIES',
                'error_message' => 'Transaction exhausted retry attempts.',
            ],
        ];
    }

    /**
     * Executes the atomic write transaction for an event:
     * Insert receipt -> Upsert Master Data -> Insert Historical Snapshot.
     */
    protected function executeEventTransaction(array $event, string $eventId, string $payloadHash): array
    {
        return DB::transaction(function () use ($event, $eventId, $payloadHash) {
            if (self::$testingExecutionHook !== null) {
                (self::$testingExecutionHook)($event, $eventId, $payloadHash);
            }

            $observedAt = (string) $event['observed_at'];
            $logicalEventKey = (string) ($event['logical_event_key'] ?? ($event['entity_type'] . ':' . $event['entity_key']));
            $entityType = (string) $event['entity_type'];
            $entityKey = (string) $event['entity_key'];
            $entityRevision = (int) ($event['entity_revision'] ?? 1);
            $crawlRunId = (string) $event['crawl_run_id'];
            $payload = (array) $event['payload'];

            // 1. Check if receipt already committed
            $existingReceipt = DB::table('crawler_event_receipts')
                ->where('event_id', $eventId)
                ->first();

            if ($existingReceipt) {
                if ($existingReceipt->payload_hash === $payloadHash) {
                    return ['status' => 'acknowledged']; // Idempotent No-Op
                }
                return [
                    'status' => 'rejected',
                    'error' => [
                        'error_code' => 'INTEGRITY_CONFLICT',
                        'error_message' => 'Event ID already exists with a different canonical payload hash.',
                    ],
                ];
            }

            // 2. Insert receipt
            DB::table('crawler_event_receipts')->insert([
                'event_id' => $eventId,
                'logical_event_key' => $logicalEventKey,
                'entity_type' => $entityType,
                'entity_key' => $entityKey,
                'payload_hash' => $payloadHash,
                'observed_at' => $observedAt,
                'acknowledged_at' => now(),
            ]);

            // 3. Upsert Master Data & Insert Historical Snapshots
            if ($entityType === 'account') {
                $this->ingestAccountMasterAndSnapshot($crawlRunId, $eventId, $payload, $observedAt, $entityRevision);
            } elseif ($entityType === 'video') {
                $this->ingestVideoMasterAndSnapshot($crawlRunId, $eventId, $payload, $observedAt, $entityRevision);
            }

            return ['status' => 'acknowledged'];
        });
    }

    /**
     * Handle duplicate key race conditions outside transaction.
     */
    protected function handleDuplicateReceipt(string $eventId, string $calculatedPayloadHash): array
    {
        for ($i = 0; $i < 3; $i++) {
            $existing = DB::table('crawler_event_receipts')->where('event_id', $eventId)->first();
            if ($existing) {
                if ($existing->payload_hash === $calculatedPayloadHash) {
                    return ['status' => 'acknowledged']; // Idempotent No-Op
                }
                return [
                    'status' => 'rejected',
                    'error' => [
                        'error_code' => 'INTEGRITY_CONFLICT',
                        'error_message' => 'Event ID collision with differing payload hash.',
                    ],
                ];
            }
            usleep(5000); // 5ms
        }

        return [
            'status' => 'retryable',
            'error' => [
                'error_code' => 'RECEIPT_RACE_TIMEOUT',
                'error_message' => 'Duplicate key detected but receipt not yet visible after retry.',
            ],
        ];
    }

    /**
     * Upsert Account Master data with observed_at protection and insert run snapshot.
     */
    protected function ingestAccountMasterAndSnapshot(
        string $crawlRunId,
        string $eventId,
        array $payload,
        string $observedAt,
        int $entityRevision
    ): void {
        $username = ltrim(trim((string) ($payload['username'] ?? '')), '@');
        $secUid = !empty($payload['sec_uid']) ? (string) $payload['sec_uid'] : null;

        if ($username === '') {
            return;
        }

        // Locate existing account
        $account = TiktokAccount::where('username', $username)
            ->orWhere('username', '@' . $username)
            ->first();

        $shouldUpdateMaster = true;
        if ($account && $account->last_observed_at) {
            $accountObservedAt = $account->last_observed_at instanceof DateTimeInterface
                ? $account->last_observed_at->format('Y-m-d H:i:s.u')
                : (string) $account->last_observed_at;

            // Tie-break via (observed_at, entity_revision)
            if ($observedAt < $accountObservedAt || ($observedAt === $accountObservedAt && $entityRevision <= (int) $account->last_entity_revision)) {
                $shouldUpdateMaster = false;
            }
        }

        if (!$account) {
            $account = new TiktokAccount();
            $account->username = $username;
        }

        if ($shouldUpdateMaster) {
            if ($secUid) {
                $account->sec_uid = $secUid;
            }
            if (!empty($payload['nickname'])) {
                $account->nickname = $payload['nickname'];
            }
            if (isset($payload['follower_count']) || isset($payload['followers'])) {
                $account->followers_count = (int) ($payload['follower_count'] ?? $payload['followers'] ?? 0);
            }
            if (isset($payload['following_count']) || isset($payload['following'])) {
                $account->following_count = (int) ($payload['following_count'] ?? $payload['following'] ?? 0);
            }
            if (isset($payload['heart_count']) || isset($payload['likes'])) {
                $account->likes_count = (int) ($payload['heart_count'] ?? $payload['likes'] ?? 0);
            }
            if (isset($payload['video_count'])) {
                $account->video_count = (int) $payload['video_count'];
            }
            if (isset($payload['is_verified'])) {
                $account->is_verified = (bool) $payload['is_verified'];
            }
            $account->last_crawled_at = now();
            $account->last_observed_at = $observedAt;
            $account->last_entity_revision = $entityRevision;
            $account->save();
        }

        // Insert historical snapshot (ignore duplicate if replayed)
        $snapFollowerCount = isset($payload['follower_count']) || isset($payload['followers'])
            ? (int) ($payload['follower_count'] ?? $payload['followers'])
            : ($account->followers_count ?? 0);
        $snapFollowingCount = isset($payload['following_count']) || isset($payload['following'])
            ? (int) ($payload['following_count'] ?? $payload['following'])
            : ($account->following_count ?? 0);
        $snapHeartCount = isset($payload['heart_count']) || isset($payload['likes'])
            ? (int) ($payload['heart_count'] ?? $payload['likes'])
            : ($account->likes_count ?? 0);
        $snapVideoCount = isset($payload['video_count'])
            ? (int) $payload['video_count']
            : ($account->video_count ?? 0);

        DB::table('crawl_run_account_snapshots')->insertOrIgnore([
            'crawl_run_id' => $crawlRunId,
            'account_id' => $account->id ?? 0,
            'sec_uid' => $account->sec_uid,
            'username' => $account->username,
            'follower_count' => $snapFollowerCount,
            'following_count' => $snapFollowingCount,
            'heart_count' => $snapHeartCount,
            'video_count' => $snapVideoCount,
            'observed_at' => $observedAt,
            'source_event_id' => $eventId,
            'created_at' => now(),
        ]);
    }

    /**
     * Upsert Video Master data with observed_at protection and insert run snapshot.
     */
    protected function ingestVideoMasterAndSnapshot(
        string $crawlRunId,
        string $eventId,
        array $payload,
        string $observedAt,
        int $entityRevision
    ): void {
        $videoId = (string) ($payload['video_id'] ?? '');
        $username = ltrim(trim((string) ($payload['username'] ?? '')), '@');

        if ($videoId === '') {
            return;
        }

        $account = null;
        if ($username !== '') {
            $account = TiktokAccount::where('username', $username)
                ->orWhere('username', '@' . $username)
                ->first();
        }

        $video = TiktokVideo::where('video_id', $videoId)->first();

        $shouldUpdateMaster = true;
        if ($video && $video->observed_at) {
            $videoObservedAt = $video->observed_at instanceof DateTimeInterface
                ? $video->observed_at->format('Y-m-d H:i:s.u')
                : (string) $video->observed_at;

            if ($observedAt < $videoObservedAt || ($observedAt === $videoObservedAt && $entityRevision <= (int) $video->last_entity_revision)) {
                $shouldUpdateMaster = false;
            }
        }

        if (!$video) {
            $video = new TiktokVideo();
            $video->video_id = $videoId;
            $video->username = $username !== '' ? $username : 'unknown';
            if ($account) {
                $video->tiktok_account_id = $account->id;
            }
        }

        if ($shouldUpdateMaster) {
            if ($account && !$video->tiktok_account_id) {
                $video->tiktok_account_id = $account->id;
            }
            if (isset($payload['play_count']) || isset($payload['views'])) {
                $video->play_count = (int) ($payload['play_count'] ?? $payload['views'] ?? 0);
            }
            if (isset($payload['digg_count']) || isset($payload['likes'])) {
                $video->digg_count = (int) ($payload['digg_count'] ?? $payload['likes'] ?? 0);
            }
            if (isset($payload['comment_count'])) {
                $video->comment_count = (int) $payload['comment_count'];
            }
            if (isset($payload['share_count'])) {
                $video->share_count = (int) $payload['share_count'];
            }
            if (!empty($payload['caption']) || !empty($payload['description'])) {
                $video->description = (string) ($payload['caption'] ?? $payload['description'] ?? '');
            }
            if (!empty($payload['music_author'])) {
                $video->music_author = (string) $payload['music_author'];
            }
            $video->observed_at = $observedAt;
            $video->last_entity_revision = $entityRevision;
            $video->last_crawled_at = now();
            $video->save();
        }

        // Insert historical snapshot
        $snapPlayCount = isset($payload['play_count']) || isset($payload['views'])
            ? (int) ($payload['play_count'] ?? $payload['views'])
            : ($video->play_count ?? 0);
        $snapDiggCount = isset($payload['digg_count']) || isset($payload['likes'])
            ? (int) ($payload['digg_count'] ?? $payload['likes'])
            : ($video->digg_count ?? 0);
        $snapCommentCount = isset($payload['comment_count'])
            ? (int) $payload['comment_count']
            : ($video->comment_count ?? 0);
        $snapShareCount = isset($payload['share_count'])
            ? (int) $payload['share_count']
            : ($video->share_count ?? 0);

        DB::table('crawl_run_video_snapshots')->insertOrIgnore([
            'crawl_run_id' => $crawlRunId,
            'video_id' => $video->video_id,
            'account_id' => $video->tiktok_account_id ?? 0,
            'play_count' => $snapPlayCount,
            'like_count' => $snapDiggCount,
            'comment_count' => $snapCommentCount,
            'share_count' => $snapShareCount,
            'observed_at' => $observedAt,
            'source_event_id' => $eventId,
            'created_at' => now(),
        ]);
    }

    /**
     * Compute RFC 8785 JSON Canonicalization Scheme (JCS) representation in PHP.
     * Recursively sorts dictionary keys lexicographically, removes whitespace, preserves UTF-8.
     */
    public static function canonicalJson(mixed $data): string
    {
        if (is_array($data)) {
            // Check if associative array
            $isAssoc = false;
            $keys = array_keys($data);
            foreach ($keys as $i => $k) {
                if ($k !== $i) {
                    $isAssoc = true;
                    break;
                }
            }

            if ($isAssoc) {
                ksort($data, SORT_STRING);
                $parts = [];
                foreach ($data as $k => $v) {
                    $keyStr = json_encode((string) $k, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
                    $valStr = self::canonicalJson($v);
                    $parts[] = "{$keyStr}:{$valStr}";
                }
                return '{' . implode(',', $parts) . '}';
            }

            // Sequential array
            $parts = array_map([self::class, 'canonicalJson'], $data);
            return '[' . implode(',', $parts) . ']';
        }

        if (is_float($data)) {
            if (floor($data) == $data) {
                return (string) ((int) $data);
            }
            return json_encode($data);
        }

        return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Compute SHA-256 hex digest of the canonical payload.
     */
    public static function computePayloadHash(array $payload): string
    {
        return hash('sha256', self::canonicalJson($payload));
    }

    /**
     * Compute canonical event_id matching Python's compute_event_id algorithm.
     */
    public static function computeEventId(array $event, string $payloadHash): string
    {
        $envelope = [
            'crawl_run_id' => (string) $event['crawl_run_id'],
            'entity_key' => (string) $event['entity_key'],
            'entity_revision' => (int) ($event['entity_revision'] ?? 1),
            'entity_type' => (string) $event['entity_type'],
            'observed_at' => (string) $event['observed_at'],
            'operation' => (string) ($event['operation'] ?? 'upsert'),
            'payload_hash' => $payloadHash,
            'schema_version' => (string) ($event['schema_version'] ?? '1.0'),
        ];

        return hash('sha256', self::canonicalJson($envelope));
    }

    /**
     * Verify HMAC-SHA256 signature if signature header is provided.
     */
    protected function verifyHmacSignature(Request $request, string $rawBody): bool
    {
        $signature = $request->header('X-Crawler-Signature');
        if (empty($signature)) {
            // Fallback to Bearer token if configured
            $configuredToken = (string) config('services.crawler.token', '');
            if ($configuredToken === '') {
                return true; // No token configured
            }
            return hash_equals($configuredToken, (string) $request->bearerToken());
        }

        $timestamp = (string) $request->header('X-Crawler-Timestamp');
        if (abs(time() - (int) $timestamp) > 300) {
            return false; // Clock skew too high (> 5 minutes)
        }

        $secret = (string) (config('services.crawler.secret') ?: config('services.crawler.token') ?: 'default_crawler_secret');
        $httpMethod = $request->method();
        $canonicalPath = '/' . ltrim($request->path(), '/');
        $bodyHash = hash('sha256', $rawBody);

        $payloadToSign = "{$timestamp}\n{$httpMethod}\n{$canonicalPath}\n{$bodyHash}";
        $expectedSignature = hash_hmac('sha256', $payloadToSign, $secret);

        return hash_equals($expectedSignature, $signature);
    }
}
