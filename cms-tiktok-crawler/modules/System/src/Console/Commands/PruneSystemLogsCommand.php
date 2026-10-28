<?php

namespace Modules\System\Console\Commands;

use Illuminate\Console\Command;
use Modules\System\Services\SystemSettingService;

class PruneSystemLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:prune-logs
                            {--activity-days= : Override activity log retention days (min: 7)}
                            {--login-days= : Override login log retention days (min: 14)}
                            {--chunk= : Override batch chunk size (default: 500)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune old activity logs and login logs based on dynamic system settings';

    /**
     * Execute the console command.
     */
    public function handle(SystemSettingService $service): int
    {
        $this->info('Starting system log pruning...');

        $options = [
            'trigger' => 'artisan_cli',
        ];

        if ($this->option('activity-days') !== null) {
            $options['activity_days'] = (int) $this->option('activity-days');
        }
        if ($this->option('login-days') !== null) {
            $options['login_days'] = (int) $this->option('login-days');
        }
        if ($this->option('chunk') !== null) {
            $options['chunk_size'] = (int) $this->option('chunk');
        }

        try {
            $result = $service->executeChunkedPrune($options);

            $this->info("System log pruning completed in {$result['duration_sec']}s.");
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Activity Logs Purged', $result['activity_logs_purged']],
                    ['Login Logs Purged', $result['login_logs_purged']],
                    ['Total Purged', $result['total_purged']],
                ]
            );

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Failed to prune system logs: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
