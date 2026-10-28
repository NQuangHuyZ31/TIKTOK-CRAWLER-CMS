<?php

namespace Modules\System\Services;

use Illuminate\Support\Facades\DB;

class SystemDiagnosticService
{
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
            'app_debug' => (bool) config('app.debug', false),
            'app_url' => config('app.url', 'http://localhost'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_driver' => $dbDriver,
            'database_connected' => $dbConnected,
            'server_os' => PHP_OS_FAMILY,
            'server_time' => now()->toIso8601String(),
            'timezone' => config('app.timezone', 'UTC'),
            'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            'memory_limit' => ini_get('memory_limit') ?: 'N/A',
            'max_execution_time' => (ini_get('max_execution_time') ?: '30') . 's',
        ];
    }
}
