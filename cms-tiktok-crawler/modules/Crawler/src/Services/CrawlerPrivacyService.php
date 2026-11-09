<?php

namespace Modules\Crawler\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class CrawlerPrivacyService
{
    public function __construct(
        protected CrawlerEngineClient $crawlerEngineClient
    ) {}

    /**
     * Check if an entity is suppressed under privacy rules.
     */
    public function isSuppressed(string $entityType, string $entityKey): bool
    {
        $normalizedKey = in_array(strtolower($entityType), ['username', 'account'])
            ? strtolower(trim(ltrim($entityKey, '@')))
            : trim($entityKey);

        return DB::table('crawler_privacy_suppressions')
            ->where('entity_type', $entityType)
            ->where('entity_key', $normalizedKey)
            ->exists();
    }

    /**
     * Request a privacy purge for an entity (GDPR / Right-to-be-forgotten / Account Removal).
     * 1. Records suppression immediately in crawler_privacy_suppressions.
     * 2. Inserts purge request in crawler_privacy_purge_requests.
     * 3. Dispatches purge to Python Crawler Service.
     * 4. If Crawler Service is down, marks status = 'pending_retry' (T21).
     */
    public function requestPurge(string $entityType, string $entityKey, ?string $reason = 'privacy_request'): array
    {
        $normalizedKey = in_array(strtolower($entityType), ['username', 'account'])
            ? strtolower(trim(ltrim($entityKey, '@')))
            : trim($entityKey);

        $purgeRequestId = 'prg_' . bin2hex(random_bytes(16));
        $now = now();

        // 1. Record immediate suppression
        DB::table('crawler_privacy_suppressions')->insertOrIgnore([
            'entity_type' => $entityType,
            'entity_key' => $normalizedKey,
            'reason' => $reason,
            'suppressed_at' => $now,
        ]);

        // 2. Record purge request
        DB::table('crawler_privacy_purge_requests')->insert([
            'purge_request_id' => $purgeRequestId,
            'entity_type' => $entityType,
            'entity_key' => $normalizedKey,
            'status' => 'requested',
            'error_message' => null,
            'requested_at' => $now,
            'completed_at' => null,
        ]);

        // 3. Dispatch to Python crawler engine
        try {
            $response = $this->crawlerEngineClient->purgePrivacyEntity(
                $entityType,
                $normalizedKey,
                $purgeRequestId,
                $reason
            );

            DB::table('crawler_privacy_purge_requests')
                ->where('purge_request_id', $purgeRequestId)
                ->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

            return [
                'purge_request_id' => $purgeRequestId,
                'entity_type' => $entityType,
                'entity_key' => $normalizedKey,
                'status' => 'completed',
                'engine_response' => $response,
            ];
        } catch (Throwable $e) {
            Log::warning("Crawler engine unavailable for privacy purge {$purgeRequestId}: " . $e->getMessage());

            // T21: If crawler-service is down during purge, state machine sets pending_retry
            DB::table('crawler_privacy_purge_requests')
                ->where('purge_request_id', $purgeRequestId)
                ->update([
                    'status' => 'pending_retry',
                    'error_message' => $e->getMessage(),
                ]);

            return [
                'purge_request_id' => $purgeRequestId,
                'entity_type' => $entityType,
                'entity_key' => $normalizedKey,
                'status' => 'pending_retry',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Retry all pending privacy purge requests.
     */
    public function retryPendingPurges(): int
    {
        $pending = DB::table('crawler_privacy_purge_requests')
            ->where('status', 'pending_retry')
            ->orderBy('requested_at', 'asc')
            ->get();

        $retriedCount = 0;

        foreach ($pending as $request) {
            try {
                $this->crawlerEngineClient->purgePrivacyEntity(
                    $request->entity_type,
                    $request->entity_key,
                    $request->purge_request_id
                );

                DB::table('crawler_privacy_purge_requests')
                    ->where('purge_request_id', $request->purge_request_id)
                    ->update([
                        'status' => 'completed',
                        'error_message' => null,
                        'completed_at' => now(),
                    ]);

                $retriedCount++;
            } catch (Throwable $e) {
                Log::debug("Retry failed for purge request {$request->purge_request_id}: " . $e->getMessage());
            }
        }

        return $retriedCount;
    }
}
