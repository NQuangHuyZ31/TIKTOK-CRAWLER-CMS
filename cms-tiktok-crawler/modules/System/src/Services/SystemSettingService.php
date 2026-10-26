<?php

namespace Modules\System\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Modules\System\Repositories\SystemSettingRepository;

class SystemSettingService
{
    protected const CACHE_KEY = 'system_settings_all_grouped';

    public function __construct(
        protected SystemSettingRepository $settingRepository
    ) {}

    /**
     * Get all settings grouped by category.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getGroupedSettings(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function () {
            return $this->settingRepository->getAllGrouped();
        });
    }

    /**
     * Get settings for a specific group.
     */
    public function getSettingsByGroup(string $group): array
    {
        $all = $this->getGroupedSettings();
        return $all[$group] ?? [];
    }

    /**
     * Batch update system settings.
     *
     * @param array<string, mixed> $settings
     */
    public function batchUpdate(array $settings, string $defaultGroup = 'general'): bool
    {
        $result = $this->settingRepository->batchUpdate($settings, $defaultGroup);
        Cache::forget(self::CACHE_KEY);
        return $result;
    }

    /**
     * Gather system runtime information and diagnostic metrics.
     */
    public function getSystemInfo(): array
    {
        $dbConnected = false;
        $dbDriver = config('database.default', 'unknown');
        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (\Throwable) {
            $dbConnected = false;
        }

        return [
            'app_name' => config('app.name', 'CMS TikTok Crawler'),
            'app_env' => config('app.env', 'production'),
            'app_debug' => config('app.debug', false),
            'app_url' => config('app.url', 'http://localhost'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_driver' => $dbDriver,
            'database_connected' => $dbConnected,
            'server_os' => PHP_OS_FAMILY,
            'server_time' => now()->toIso8601String(),
            'timezone' => config('app.timezone', 'UTC'),
            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time') . 's',
        ];
    }
}
