<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\System\Facades\Audit;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlJobService
{
    public const SERVICE_SHUTDOWN_MESSAGE = 'Crawler service has shut down — waiting for service to restart and resume.';

    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlVideoResultRepositoryInterface $crawlVideoResultRepository,
        protected CrawlerEngineClient $engineClient,
    ) {}

    /**
     * Domain logic: Create a new crawl job.
     */
    public function create(array $data): CrawlJob
    {
        $sourceType = $data['source_type'] ?? 'usernames';
        $crawlMode = $data['crawl_mode'] ?? 'account_with_videos';
        $maxVideosPerAccount = isset($data['max_videos_per_account']) ? (int) $data['max_videos_per_account'] : 20;
        $dataCrawl = $data['data_crawl'] ?? [];

        if (is_string($dataCrawl)) {
            $decoded = json_decode($dataCrawl, true);
            $dataCrawl = is_array($decoded) ? $decoded : [$dataCrawl];
        }

        $totalAccounts = match ($sourceType) {
            'usernames', 'urls', 'database' => count($dataCrawl),
            'count' => (int) ($dataCrawl[0] ?? $data['total_accounts'] ?? 0),
            default => count($dataCrawl),
        };

        return $this->crawlJobRepository->create([
            'source_type' => $sourceType,
            'crawl_mode' => $crawlMode,
            'max_videos_per_account' => $maxVideosPerAccount,
            'data_crawls' => json_encode($dataCrawl),
            'total_accounts' => $totalAccounts,
            'status' => 'pending',
            'success_count' => 0,
            'failed_count' => 0,
            'total_videos_crawled' => 0,
            'created_by' => $data['created_by'] ?? $this->currentUserId(),
        ]);
    }

    /**
     * Domain logic: Update an existing crawl job.
     */
    public function update(int $id, array $data): ?CrawlJob
    {
        $job = $this->crawlJobRepository->findById($id);
        if (!$job) {
            return null;
        }

        if ($job->status !== 'pending') {
            throw new \DomainException('Only pending crawl jobs can be updated.');
        }

        if (isset($data['source_type']) && !isset($data['data_crawl']) && $data['source_type'] !== $job->source_type) {
            throw new \DomainException('Changing source_type requires providing matching data_crawl.');
        }

        $updateData = [];

        if (isset($data['source_type'])) {
            $updateData['source_type'] = $data['source_type'];
        }

        if (isset($data['crawl_mode']) && in_array($data['crawl_mode'], ['account_only', 'account_with_videos', 'video_only'], true)) {
            $updateData['crawl_mode'] = $data['crawl_mode'];
        }

        if (isset($data['max_videos_per_account'])) {
            $updateData['max_videos_per_account'] = max(0, min(100, (int) $data['max_videos_per_account']));
        }

        if (isset($data['data_crawl'])) {
            $dataCrawl = $data['data_crawl'];
            if (is_string($dataCrawl)) {
                $decoded = json_decode($dataCrawl, true);
                $dataCrawl = is_array($decoded) ? $decoded : [$dataCrawl];
            }

            $sourceType = $data['source_type'] ?? $job->source_type;
            $this->validateDataCrawlForSourceType($sourceType, $dataCrawl);

            $updateData['data_crawls'] = json_encode($dataCrawl);
            $updateData['total_accounts'] = match ($sourceType) {
                'usernames', 'urls', 'database' => count($dataCrawl),
                'count' => (int) ($dataCrawl[0] ?? $job->total_accounts),
                default => count($dataCrawl),
            };
        }

        if (!empty($updateData)) {
            $this->crawlJobRepository->update($id, $updateData);
            $job = $this->crawlJobRepository->findById($id);
        }

        return $job;
    }

    /**
     * Domain logic: Delete a crawl job.
     */
    public function delete(int $id): bool
    {
        $job = $this->crawlJobRepository->findById($id);
        if (!$job) {
            return false;
        }

        if ($job->status === 'running') {
            throw new \DomainException('Cannot delete a running crawl job.');
        }

        if ($job->status === 'queued') {
            $this->engineClient->cancelJob($id);
        }

        return (bool) $this->crawlJobRepository->delete($id);
    }

    /**
     * Domain logic: Retrieve KPI dashboard statistics summary.
     */
    public function getStatisticsSummary(): array
    {
        return $this->crawlJobRepository->getStatisticsSummary();
    }

    /**
     * Domain logic: Retrieve paginated crawl results for a specific job.
     */
    public function getJobResults(int $jobId, int $perPage = 10, array $filters = []): ?LengthAwarePaginator
    {
        $job = $this->crawlJobRepository->findById($jobId);
        if (!$job) {
            return null;
        }

        return $this->crawlResultRepository->getByJobId($jobId, $perPage, $filters);
    }

    /**
     * Domain logic: Retrieve paginated video crawl results for a specific job.
     */
    public function getJobVideoResults(int $jobId, int $perPage = 10, array $filters = []): ?LengthAwarePaginator
    {
        $job = $this->crawlJobRepository->findById($jobId);
        if (!$job) {
            return null;
        }

        return $this->crawlVideoResultRepository->getByJobId($jobId, $perPage, $filters);
    }

    /**
     * Domain logic: Start a crawl job by dispatching it to the Python Crawler Queue.
     */
    public function start(int $id): ?CrawlJob
    {
        $crawlJob = $this->crawlJobRepository->findById($id);

        if (!$crawlJob) {
            return null;
        }

        if ($crawlJob->status !== 'pending') {
            throw new \DomainException("Crawl job #{$id} is in status '{$crawlJob->status}', only 'pending' jobs can be started.");
        }

        $payload = $this->buildCrawlerPayload($id, $crawlJob);
        try {
            $response = $this->engineClient->startJob($payload);
        } catch (\Throwable $e) {
            Audit::record(
                action: 'CRAWL_FAILED',
                target: 'job_crawl_' . $id,
                metadata: [
                    'source_type' => $crawlJob->source_type,
                    'total_accounts' => $crawlJob->total_accounts,
                    'error' => $e->getMessage(),
                ],
                status: 'FAILED',
                module: 'TIKTOK',
                recordType: 'CrawlJob'
            );
            throw $e;
        }

        $updateAttributes = [
            'status' => 'queued',
            'queued_at' => now(),
            'error_message' => null,
            'started_by' => $this->currentUserId() ?? $crawlJob->started_by,
        ];

        if (!empty($response['targets']) && is_array($response['targets'])) {
            $updateAttributes['data_crawls'] = json_encode(array_values($response['targets']));
            if ($crawlJob->source_type !== 'count') {
                $updateAttributes['total_accounts'] = count($response['targets']);
            }
        }

        $this->crawlJobRepository->update($id, $updateAttributes);

        Audit::record(
            action: 'CRAWL',
            target: 'job_crawl_' . $id,
            metadata: [
                'source_type' => $crawlJob->source_type,
                'total_accounts' => $updateAttributes['total_accounts'] ?? $crawlJob->total_accounts,
                'trigger_by' => 'manual',
            ],
            status: 'SUCCESS',
            module: 'TIKTOK',
            recordType: 'CrawlJob'
        );

        return $this->crawlJobRepository->findById($id);
    }

    /**
     * Domain logic: Retry a failed crawl job.
     */
    public function retry(int $id): ?CrawlJob
    {
        // Phase 0 – Load, Validate and Build Payload
        $crawlJob = $this->crawlJobRepository->findById($id);

        if (!$crawlJob) {
            return null;
        }

        if ($crawlJob->status !== 'failed') {
            throw new \DomainException("Crawl job #{$id} is in status '{$crawlJob->status}', only 'failed' jobs can be retried.");
        }

        $payload = $this->buildCrawlerPayload($id, $crawlJob);

        // Phase 1 – Atomic Claim
        if (!$this->crawlJobRepository->claimForRetry($id)) {
            throw new \DomainException("Crawl job #{$id} could not be claimed for retry (already claimed or status changed).");
        }

        // Phase 2 – Cleanup Transaction
        try {
            DB::transaction(function () use ($id, $crawlJob) {
                $this->crawlResultRepository->deleteByJobId($id);
                $this->crawlVideoResultRepository->deleteByJobId($id);

                $resetAttributes = [
                    'started_at' => null,
                    'finished_at' => null,
                    'success_count' => 0,
                    'failed_count' => 0,
                    'total_videos_crawled' => 0,
                    'worker_id' => null,
                    'error_message' => null,
                    'started_by' => $this->currentUserId() ?? $crawlJob->started_by,
                ];

                $reset = $this->crawlJobRepository->resetForRetry($id, $resetAttributes);
                if (!$reset) {
                    throw new \RuntimeException("Failed to reset fields for CrawlJob #{$id}: job is no longer queued or record could not be updated.");
                }
            });
        } catch (\Throwable $cleanupError) {
            try {
                $this->crawlJobRepository->restoreFailedClaim($id, 'Retry cleanup failed: ' . $cleanupError->getMessage());
            } catch (\Throwable $restoreError) {
                try {
                    Log::error("Failed to restore claim after cleanup error for job #{$id}: " . $restoreError->getMessage());
                } catch (\Throwable) {}
            }

            try {
                Audit::record(
                    action: 'CRAWL_FAILED',
                    target: 'job_crawl_' . $id,
                    metadata: [
                        'source_type' => $crawlJob->source_type,
                        'total_accounts' => $crawlJob->total_accounts,
                        'error' => 'Cleanup failed: ' . $cleanupError->getMessage(),
                    ],
                    status: 'FAILED',
                    module: 'TIKTOK',
                    recordType: 'CrawlJob'
                );
            } catch (\Throwable $auditError) {
                try {
                    Log::error("Failed to record failure audit for job #{$id}: " . $auditError->getMessage());
                } catch (\Throwable) {}
            }

            throw $cleanupError;
        }

        // Phase 3 – Python Dispatch (Outside DB Transaction)
        try {
            $response = $this->engineClient->startJob($payload);
        } catch (\Throwable $dispatchError) {
            try {
                $this->crawlJobRepository->restoreFailedClaim($id, 'Crawler dispatch failed: ' . $dispatchError->getMessage());
            } catch (\Throwable $restoreError) {
                try {
                    Log::error("Failed to restore claim after dispatch error for job #{$id}: " . $restoreError->getMessage());
                } catch (\Throwable) {}
            }

            try {
                Audit::record(
                    action: 'CRAWL_FAILED',
                    target: 'job_crawl_' . $id,
                    metadata: [
                        'source_type' => $crawlJob->source_type,
                        'total_accounts' => $crawlJob->total_accounts,
                        'error' => $dispatchError->getMessage(),
                    ],
                    status: 'FAILED',
                    module: 'TIKTOK',
                    recordType: 'CrawlJob'
                );
            } catch (\Throwable $auditError) {
                try {
                    Log::error("Failed to record failure audit for job #{$id}: " . $auditError->getMessage());
                } catch (\Throwable) {}
            }

            throw $dispatchError;
        }

        // Phase 4 – Dynamic Target Synchronization
        if (isset($response['targets']) && is_array($response['targets'])) {
            try {
                $this->crawlJobRepository->syncDynamicTargets($id, $response['targets']);
            } catch (\Throwable $syncError) {
                try {
                    Log::critical("Failed to synchronize dynamic targets for job #{$id}: " . $syncError->getMessage());
                } catch (\Throwable) {}
            }
        }

        // Phase 5 – Success Audit and Return
        try {
            Audit::record(
                action: 'RETRY_CRAWL',
                target: 'job_crawl_' . $id,
                metadata: [
                    'retry_count' => ($crawlJob->resume_count ?? 1),
                    'trigger_by' => 'manual',
                    'source_type' => $crawlJob->source_type,
                ],
                status: 'SUCCESS',
                module: 'TIKTOK',
                recordType: 'CrawlJob'
            );
        } catch (\Throwable $auditError) {
            try {
                Log::warning("Failed to record RETRY_CRAWL audit for job #{$id}: " . $auditError->getMessage());
            } catch (\Throwable) {}
        }

        return $this->crawlJobRepository->findById($id);
    }

    /**
     * Domain logic: Stop/cancel a running or queued crawl job.
     */
    public function stop(int $id, string $reason = 'Job was manually stopped by user.'): ?CrawlJob
    {
        $crawlJob = $this->crawlJobRepository->findById($id);

        if (!$crawlJob) {
            return null;
        }

        if (!in_array($crawlJob->status, ['running', 'queued'], true)) {
            throw new \DomainException("Crawl job #{$id} is in status '{$crawlJob->status}', only 'running' or 'queued' jobs can be stopped.");
        }

        $this->engineClient->cancelJob($id);

        $successCount = $this->crawlResultRepository->countByStatus($id, 'success');
        $failedCount = $this->crawlResultRepository->countByStatus($id, 'failed');

        $this->crawlJobRepository->update($id, [
            'status' => 'failed',
            'finished_at' => now(),
            'worker_id' => null,
            'success_count' => $successCount ?: ($crawlJob->success_count ?? 0),
            'failed_count' => $failedCount ?: ($crawlJob->failed_count ?? 0),
            'error_message' => $reason,
        ]);

        Audit::record(
            action: 'STOP_CRAWL',
            target: 'job_crawl_' . $id,
            metadata: [
                'source_type' => $crawlJob->source_type,
                'reason' => $reason,
                'trigger_by' => 'manual',
            ],
            status: 'SUCCESS',
            module: 'TIKTOK',
            recordType: 'CrawlJob'
        );

        return $this->crawlJobRepository->findById($id);
    }

    /**
     * Automatically synchronize 'running' and 'queued' jobs with the Python Crawler Engine.
     */
    public function syncActiveJobsWithEngine(?int $jobId = null, bool $force = false): void
    {
        if (app()->runningUnitTests() && !$force && !config('services.crawler.sync_in_tests', false)) {
            return;
        }

        $activeJobs = $jobId !== null
            ? $this->crawlJobRepository->getActiveJobById($jobId)
            : $this->crawlJobRepository->getUnfinishedJobs();

        if ($activeJobs->isEmpty()) {
            return;
        }

        $queueOverview = $this->engineClient->getQueueStatus();
        if ($queueOverview === null) {
            $this->markActiveJobsWaitingForRestart($activeJobs);
            return;
        }

        // Service is online: clear shutdown waiting message if job is active again
        foreach ($activeJobs as $job) {
            if ($job->error_message === self::SERVICE_SHUTDOWN_MESSAGE) {
                $this->crawlJobRepository->update($job->id, ['error_message' => null]);
            }
        }
    }

    protected function markActiveJobsWaitingForRestart(iterable $jobs): void
    {
        foreach ($jobs as $job) {
            if ($job->error_message !== self::SERVICE_SHUTDOWN_MESSAGE) {
                $this->crawlJobRepository->update($job->id, [
                    'error_message' => self::SERVICE_SHUTDOWN_MESSAGE,
                ]);
            }
        }
    }

    /**
     * Retrieve unfinished ('running' and 'queued') jobs with their frozen targets and done_usernames
     */
    public function getUnfinishedJobsForRecovery(): array
    {
        $jobs = $this->crawlJobRepository->getUnfinishedJobs();
        $items = [];

        foreach ($jobs as $job) {
            $raw = $job->data_crawls;
            $targets = is_array($raw) ? $raw : json_decode((string) $raw, true);
            if (!is_array($targets)) {
                $targets = [];
            }

            if ($job->source_type === 'database' && !empty($targets)) {
                $targets = $this->tiktokAccountRepository->getUsernamesByIds($targets);
            }

            $doneUsernames = $this->crawlResultRepository->getDoneUsernames($job->id);

            $items[] = [
                'job_id' => $job->id,
                'source_type' => $job->source_type === 'urls' ? 'urls' : 'usernames',
                'status' => $job->status,
                'targets' => array_values($targets),
                'done_usernames' => $doneUsernames,
                'done_accounts' => $doneUsernames,
            ];
        }

        return $items;
    }

    protected function currentUserId(): ?int
    {
        $user = auth('sanctum')->user()
            ?? auth()->user()
            ?? (request() ? request()->user() : null);

        return $user?->id ? (int) $user->id : null;
    }

    /**
     * Prepare standardized payload for Python Crawler Service.
     */
    protected function buildCrawlerPayload(int $jobId, CrawlJob $crawlJob): array
    {
        $raw = $crawlJob->data_crawls;
        $data = is_array($raw) ? $raw : json_decode((string) $raw, true);

        if (!is_array($data) || empty($data)) {
            throw new \InvalidArgumentException('Crawl job data is empty or invalid.');
        }

        $crawlMode = $crawlJob->crawl_mode ?? 'account_with_videos';
        $maxVideos = (int) ($crawlJob->max_videos_per_account ?? 20);

        if ($crawlJob->source_type === 'database') {
            $usernames = $this->tiktokAccountRepository->getUsernamesByIds($data);

            if (empty($usernames)) {
                throw new \RuntimeException('No matching TikTok accounts found in the database.');
            }

            return [
                'job_id' => $jobId,
                'source_type' => 'usernames',
                'usernames' => $usernames,
                'crawl_mode' => $crawlMode,
                'max_videos_per_account' => $maxVideos,
            ];
        }

        if ($crawlJob->source_type === 'count') {
            // If targets were already frozen into usernames on a previous start, reuse them
            if (count($data) > 1 || (isset($data[0]) && !is_numeric($data[0]))) {
                return [
                    'job_id' => $jobId,
                    'source_type' => 'usernames',
                    'usernames' => array_values($data),
                    'crawl_mode' => $crawlMode,
                    'max_videos_per_account' => $maxVideos,
                ];
            }

            return [
                'job_id' => $jobId,
                'source_type' => 'count',
                'total_accounts' => (int) ($data[0] ?? $crawlJob->total_accounts ?? 0),
                'crawl_mode' => $crawlMode,
                'max_videos_per_account' => $maxVideos,
            ];
        }

        return match ($crawlJob->source_type) {
            'usernames' => [
                'job_id' => $jobId,
                'source_type' => 'usernames',
                'usernames' => $data,
                'crawl_mode' => $crawlMode,
                'max_videos_per_account' => $maxVideos,
            ],
            'urls' => [
                'job_id' => $jobId,
                'source_type' => 'urls',
                'urls' => $data,
                'crawl_mode' => $crawlMode,
                'max_videos_per_account' => $maxVideos,
            ],
            default => throw new \InvalidArgumentException("Unsupported crawl source type: {$crawlJob->source_type}"),
        };
    }

    /**
     * Enforce domain contracts for crawl targets based on effective source type.
     */
    protected function validateDataCrawlForSourceType(string $sourceType, array $data): void
    {
        if (empty($data)) {
            throw new \DomainException('Crawl targets cannot be empty.');
        }

        switch ($sourceType) {
            case 'usernames':
                if (!array_is_list($data)) {
                    throw new \DomainException('Targets for usernames must be a list of non-empty strings.');
                }
                foreach ($data as $item) {
                    if (!is_string($item) || trim($item) === '') {
                        throw new \DomainException('All targets for usernames must be non-empty strings.');
                    }
                }
                break;

            case 'urls':
                if (!array_is_list($data)) {
                    throw new \DomainException('Targets for urls must be a list of valid HTTP or HTTPS URLs.');
                }
                foreach ($data as $item) {
                    if (!is_string($item) || !filter_var($item, FILTER_VALIDATE_URL) || (!str_starts_with($item, 'http://') && !str_starts_with($item, 'https://'))) {
                        throw new \DomainException('All targets for urls must be valid HTTP or HTTPS URLs.');
                    }
                }
                break;

            case 'database':
                if (!array_is_list($data)) {
                    throw new \DomainException('Targets for database must be a list of positive integer account IDs.');
                }
                foreach ($data as $item) {
                    if (!$this->isPositiveInteger($item)) {
                        throw new \DomainException('All targets for database must be positive integer account IDs.');
                    }
                }
                break;

            case 'count':
                if (!array_is_list($data) || count($data) !== 1 || !array_key_exists(0, $data) || !$this->isPositiveInteger($data[0])) {
                    throw new \DomainException('Targets for count must contain exactly one positive integer.');
                }
                break;

            default:
                throw new \DomainException("Unsupported crawl source type: {$sourceType}");
        }
    }

    /**
     * Determine if a value is a valid positive integer or positive integer string.
     */
    private function isPositiveInteger(mixed $val): bool
    {
        if (is_int($val)) {
            return $val > 0;
        }

        if (is_string($val) && ctype_digit($val)) {
            $trimmed = ltrim($val, '0');
            if ($trimmed === '') {
                return false;
            }

            // Reject values exceeding 64-bit signed integer range (PHP_INT_MAX: 19 digits)
            if (strlen($trimmed) > 19 || (strlen($trimmed) === 19 && strcmp($trimmed, (string) PHP_INT_MAX) > 0)) {
                return false;
            }

            $intVal = (int) $trimmed;

            return $intVal > 0 && (string) $intVal === $trimmed;
        }

        return false;
    }
}
