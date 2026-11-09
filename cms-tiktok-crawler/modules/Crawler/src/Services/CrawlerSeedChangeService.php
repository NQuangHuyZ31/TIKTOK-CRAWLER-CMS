<?php

namespace Modules\Crawler\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CrawlerSeedChangeService
{
    /**
     * Record a seed account modification in the commit-ordered change log.
     * Guaranteed monotonic sequence via SELECT ... FOR UPDATE within a MySQL transaction.
     */
    public function recordChange(int $accountId, string $operation, ?array $payload = null): int
    {
        return DB::transaction(function () use ($accountId, $operation, $payload) {
            // 1. Lock sequence row 1
            $seqRow = DB::table('crawler_seed_sequence')
                ->where('id', 1)
                ->lockForUpdate()
                ->first();

            if (!$seqRow) {
                DB::table('crawler_seed_sequence')->insert([
                    'id' => 1,
                    'last_sequence' => 0,
                ]);
                $currentSeq = 0;
            } else {
                $currentSeq = (int) $seqRow->last_sequence;
            }

            $newSeq = $currentSeq + 1;

            // 2. Increment sequence
            DB::table('crawler_seed_sequence')
                ->where('id', 1)
                ->update(['last_sequence' => $newSeq]);

            // 3. Insert change log record
            DB::table('crawler_seed_changes')->insert([
                'sequence_id' => $newSeq,
                'account_id' => $accountId,
                'operation' => $operation,
                'payload_json' => $payload !== null ? json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) : null,
                'changed_at' => Carbon::now('UTC')->format('Y-m-d H:i:s.u'),
            ]);

            return $newSeq;
        });
    }

    /**
     * Retrieve a batch of seed changes strictly after the given sequence_id.
     */
    public function getChangesAfter(int $sinceSequence, int $limit = 100): array
    {
        $limit = max(1, min(500, $limit));

        $changes = DB::table('crawler_seed_changes')
            ->where('sequence_id', '>', $sinceSequence)
            ->orderBy('sequence_id', 'asc')
            ->limit($limit)
            ->get();

        $latestSeq = DB::table('crawler_seed_sequence')
            ->where('id', 1)
            ->value('last_sequence') ?? 0;

        $results = [];
        foreach ($changes as $c) {
            $payload = $c->payload_json ? json_decode($c->payload_json, true) : null;
            $results[] = [
                'sequence_id' => (int) $c->sequence_id,
                'account_id' => (int) $c->account_id,
                'operation' => $c->operation,
                'payload' => $payload,
                'changed_at' => $c->changed_at,
            ];
        }

        $lastChangeSeq = !empty($results) ? (int) $results[count($results) - 1]['sequence_id'] : $sinceSequence;

        return [
            'latest_sequence' => (int) $latestSeq,
            'since_sequence' => $sinceSequence,
            'count' => count($results),
            'has_more' => count($results) === $limit && $lastChangeSeq < (int) $latestSeq,
            'changes' => $results,
        ];
    }
}
