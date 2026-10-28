<?php

namespace Modules\System\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\System\Services\SystemSettingService;

class PruneExpiredLogsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 600;

    /**
     * Additional options to override defaults.
     *
     * @var array<string, mixed>
     */
    public array $options;

    public function __construct(array $options = [])
    {
        $this->options = $options;
    }

    /**
     * Execute the job.
     */
    public function handle(SystemSettingService $service): void
    {
        Log::info('[PruneExpiredLogsJob] Starting background expired logs cleanup job...');

        try {
            $options = array_merge(['trigger' => 'scheduled'], $this->options);
            $result = $service->executeChunkedPrune($options);

            Log::info('[PruneExpiredLogsJob] Cleanup completed successfully.', $result);
        } catch (\Throwable $e) {
            Log::error('[PruneExpiredLogsJob] Cleanup failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
