<?php

namespace Modules\System\Services;

use Cron\CronExpression;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\System\Facades\Audit;
use Modules\System\Models\ActivityLog;
use Modules\System\Models\LoginLog;
use Modules\System\Repositories\Interfaces\SystemSettingRepositoryInterface;

class SystemSettingService
{
    private const CACHE_PREFIX = 'system_setting_';
    private const CACHE_GROUP_PREFIX = 'system_settings_group_';

    public function __construct(
        protected SystemSettingRepositoryInterface $settingRepository
    ) {}

    /**
     * Retrieve all settings in a specific group.
     */
    public function getGroupSettings(string $group = 'worker'): array
    {
        return Cache::rememberForever(self::CACHE_GROUP_PREFIX . $group, function () use ($group) {
            return $this->settingRepository->getByGroup($group);
        });
    }

    /**
     * Retrieve a single setting by key with caching.
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return Cache::rememberForever(self::CACHE_PREFIX . $key, function () use ($key, $default) {
            return $this->settingRepository->getByKey($key, $default);
        });
    }

    /**
     * Update settings for a specific group and clear relevant caches.
     */
    public function updateGroupSettings(string $group, array $settings): array
    {
        // Enforce safety floor constraints on retention days
        if (isset($settings['activity_log_retention_days'])) {
            $settings['activity_log_retention_days'] = max(7, (int) $settings['activity_log_retention_days']);
        }
        if (isset($settings['login_log_retention_days'])) {
            $settings['login_log_retention_days'] = max(14, (int) $settings['login_log_retention_days']);
        }
        if (isset($settings['cleanup_chunk_size'])) {
            $settings['cleanup_chunk_size'] = max(50, min(5000, (int) $settings['cleanup_chunk_size']));
        }

        $this->settingRepository->setMany($settings, $group);

        // Invalidate caches
        Cache::forget(self::CACHE_GROUP_PREFIX . $group);
        foreach (array_keys($settings) as $key) {
            Cache::forget(self::CACHE_PREFIX . $key);
        }

        return $this->getGroupSettings($group);
    }

    /**
     * Check if automated log pruning worker is enabled.
     */
    public function isAutoCleanupEnabled(): bool
    {
        return (bool) $this->getSetting('auto_cleanup_enabled', true);
    }

    /**
     * Dynamically evaluate if log cleanup worker is due to run at current minute.
     */
    public function shouldRunCleanupNow(): bool
    {
        if (!$this->isAutoCleanupEnabled()) {
            return false;
        }

        $cronExpression = (string) $this->getSetting('cleanup_schedule_cron', '0 2 * * *');

        if (!CronExpression::isValidExpression($cronExpression)) {
            Log::warning("[SystemSettingService] Invalid cleanup cron expression encountered: {$cronExpression}");
            return false;
        }

        try {
            $cron = new CronExpression($cronExpression);
            return $cron->isDue(now());
        } catch (\Throwable $e) {
            Log::error("[SystemSettingService] Failed to evaluate cron: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Execute chunked deletion for expired logs with table lock prevention.
     *
     * @param array<string, mixed> $overrideOptions
     * @return array{activity_logs_purged: int, login_logs_purged: int, total_purged: int, duration_sec: float}
     */
    public function executeChunkedPrune(array $overrideOptions = []): array
    {
        $startTime = microtime(true);

        // Update status to running
        $this->settingRepository->setKey('last_cleanup_status', 'running', 'worker');

        $actDays = isset($overrideOptions['activity_days'])
            ? max(7, (int) $overrideOptions['activity_days'])
            : max(7, (int) $this->getSetting('activity_log_retention_days', 30));

        $loginDays = isset($overrideOptions['login_days'])
            ? max(14, (int) $overrideOptions['login_days'])
            : max(14, (int) $this->getSetting('login_log_retention_days', 60));

        $chunkSize = isset($overrideOptions['chunk_size'])
            ? max(50, min(5000, (int) $overrideOptions['chunk_size']))
            : (int) $this->getSetting('cleanup_chunk_size', 500);

        $sleepMs = isset($overrideOptions['sleep_ms'])
            ? (int) $overrideOptions['sleep_ms']
            : (int) $this->getSetting('cleanup_sleep_between_batches_ms', 100);

        try {
            $purgedActivity = $this->pruneTableChunked(
                ActivityLog::class,
                now()->subDays($actDays),
                $chunkSize,
                $sleepMs
            );

            $purgedLogin = $this->pruneTableChunked(
                LoginLog::class,
                now()->subDays($loginDays),
                $chunkSize,
                $sleepMs
            );

            $totalPurged = $purgedActivity + $purgedLogin;
            $duration = round(microtime(true) - $startTime, 2);

            $result = [
                'activity_logs_purged' => $purgedActivity,
                'login_logs_purged' => $purgedLogin,
                'total_purged' => $totalPurged,
                'duration_sec' => $duration,
            ];

            $this->recordCleanupExecutionSuccess($result, $overrideOptions['trigger'] ?? 'scheduled');

            return $result;
        } catch (\Throwable $e) {
            $this->recordCleanupExecutionFailure($e->getMessage(), $overrideOptions['trigger'] ?? 'scheduled');
            throw $e;
        }
    }

    /**
     * Chunked deletion implementation yielding CPU/IO via micro-sleep.
     */
    protected function pruneTableChunked(string $modelClass, Carbon $cutoffDate, int $chunkSize, int $sleepMs): int
    {
        $totalDeleted = 0;

        do {
            $ids = $modelClass::where('created_at', '<', $cutoffDate)
                ->limit($chunkSize)
                ->pluck('id');

            $count = $ids->count();
            if ($count > 0) {
                $modelClass::whereIn('id', $ids)->delete();
                $totalDeleted += $count;

                if ($sleepMs > 0) {
                    usleep($sleepMs * 1000);
                }
            }
        } while ($count === $chunkSize);

        return $totalDeleted;
    }

    /**
     * Record successful cleanup run in settings and append to history log.
     */
    public function recordCleanupExecutionSuccess(array $result, string $trigger = 'scheduled'): void
    {
        $executedAt = now()->toDateTimeString();
        $history = (array) $this->getSetting('last_cleanup_history', []);

        $newEntry = [
            'id' => uniqid('cln_'),
            'executed_at' => $executedAt,
            'trigger' => $trigger,
            'status' => 'success',
            'purged_count' => $result['total_purged'],
            'activity_logs_purged' => $result['activity_logs_purged'],
            'login_logs_purged' => $result['login_logs_purged'],
            'duration_sec' => $result['duration_sec'],
            'error_message' => null,
        ];

        // Keep last 10 entries
        array_unshift($history, $newEntry);
        $history = array_slice($history, 0, 10);

        $updates = [
            'last_cleanup_at' => $executedAt,
            'last_cleanup_purged_count' => $result['total_purged'],
            'last_cleanup_duration_sec' => (string) $result['duration_sec'],
            'last_cleanup_status' => 'success',
            'last_cleanup_history' => $history,
        ];

        $this->updateGroupSettings('worker', $updates);

        Audit::record(
            action: 'MAINTENANCE_PRUNE',
            target: null,
            metadata: $newEntry,
            status: 'SUCCESS',
            module: 'SYSTEM'
        );
    }

    /**
     * Record failed cleanup run in settings and history.
     */
    public function recordCleanupExecutionFailure(string $errorMessage, string $trigger = 'scheduled'): void
    {
        $executedAt = now()->toDateTimeString();
        $history = (array) $this->getSetting('last_cleanup_history', []);

        $newEntry = [
            'id' => uniqid('cln_'),
            'executed_at' => $executedAt,
            'trigger' => $trigger,
            'status' => 'failed',
            'purged_count' => 0,
            'activity_logs_purged' => 0,
            'login_logs_purged' => 0,
            'duration_sec' => 0,
            'error_message' => $errorMessage,
        ];

        array_unshift($history, $newEntry);
        $history = array_slice($history, 0, 10);

        $updates = [
            'last_cleanup_at' => $executedAt,
            'last_cleanup_status' => 'failed',
            'last_cleanup_history' => $history,
        ];

        $this->updateGroupSettings('worker', $updates);

        Audit::record(
            action: 'MAINTENANCE_PRUNE_FAILED',
            target: null,
            metadata: $newEntry,
            status: 'FAILED',
            errorMessage: $errorMessage,
            module: 'SYSTEM'
        );
    }
}
