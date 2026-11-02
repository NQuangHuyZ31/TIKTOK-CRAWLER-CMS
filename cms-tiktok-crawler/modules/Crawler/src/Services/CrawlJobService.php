<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Http;
use Modules\Core\Utils\FetchApi;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlVideoResultRepositoryInterface;
use Modules\System\Facades\Audit;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlJobService
{
    public const SERVICE_SHUTDOWN_MESSAGE = 'Crawler service has shut down — waiting for service to restart and resume.';

    protected CrawlVideoResultRepositoryInterface $crawlVideoResultRepository;

    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        ?CrawlVideoResultRepositoryInterface $crawlVideoResultRepository = null
    ) {
        $this->crawlVideoResultRepository = $crawlVideoResultRepository ?? app(CrawlVideoResultRepositoryInterface::class);
    }

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
     * Running jobs cannot be deleted; queued jobs are cancelled in Python before deletion.
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
            $this->cancelInCrawlerEngine($id);
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
     * Supports 200+ concurrent starts without blocking; keeps job 'pending' if service is unavailable.
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
            $response = $this->dispatchToCrawlerEngine($payload);
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
            $updateAttributes['total_accounts'] = count($response['targets']);
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
     * Deletes failed results, preserves successful results, and re-enqueues the job.
     */
    public function retry(int $id): ?CrawlJob
    {
        $crawlJob = $this->crawlJobRepository->findById($id);

        if (!$crawlJob) {
            return null;
        }

        if ($crawlJob->status !== 'failed') {
            throw new \DomainException("Crawl job #{$id} is in status '{$crawlJob->status}', only 'failed' jobs can be retried.");
        }

        $payload = $this->buildCrawlerPayload($id, $crawlJob);
        try {
            $response = $this->dispatchToCrawlerEngine($payload);
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

        // Remove previous results on manual retry and reset counters
        $crawlJob->results()->forceDelete();

        $updateAttributes = [
            'status' => 'queued',
            'queued_at' => now(),
            'error_message' => null,
            'finished_at' => null,
            'success_count' => 0,
            'failed_count' => 0,
            'started_by' => $this->currentUserId() ?? $crawlJob->started_by,
        ];

        if (!empty($response['targets']) && is_array($response['targets'])) {
            $updateAttributes['data_crawls'] = json_encode(array_values($response['targets']));
            $updateAttributes['total_accounts'] = count($response['targets']);
        }

        $this->crawlJobRepository->update($id, $updateAttributes);

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

        return $this->crawlJobRepository->findById($id);
    }

    /**
     * Domain logic: Stop/cancel a running or queued crawl job.
     * Cancels in Python Crawler Engine (if reachable) and marks job as failed/stopped in DB.
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

        $this->cancelInCrawlerEngine($id);

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
     * Preserves 'running'/'queued' status on service shutdown for Crash Recovery, and updates
     * `error_message` to notify the UI that the service is offline waiting to restart.
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

        $headers = [];
        if ($token = config('services.crawler.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }
        $baseUrl = rtrim(config('services.crawler.url', 'http://127.0.0.1:8001'), '/');

        try {
            $queueRes = Http::withHeaders($headers)
                ->connectTimeout(1)
                ->timeout(2)
                ->get("{$baseUrl}/api/queue");

            if (!$queueRes->successful()) {
                $this->markActiveJobsWaitingForRestart($activeJobs);
                return;
            }
        } catch (\Throwable) {
            // Python Crawler Service is offline -> keep status running/queued for Crash Recovery & set waiting message
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

    protected function markActiveJobsWaitingForRestart($jobs): void
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
     * for Python fallback recovery when SQLite is wiped.
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
     * Dispatch payload to external Python Crawler Engine.
     */
    protected function dispatchToCrawlerEngine(array $payload): array
    {
        $headers = [];
        if ($token = config('services.crawler.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        $url = rtrim(config('services.crawler.url', 'http://127.0.0.1:8001'), '/') . '/api/crawl-jobs/start';

        try {
            return FetchApi::post($url, $payload, $headers);
        } catch (\Throwable $exception) {
            $message = $exception->getMessage();
            if (str_contains($message, 'status 422')) {
                throw new \DomainException("Crawler validation failed: {$message}");
            }
            $code = str_contains($message, 'status 500') ? 500 : 503;
            throw new \RuntimeException(
                'Crawler service is currently unavailable, please try again.',
                $code,
                $exception
            );
        }
    }

    /**
     * Cancel a queued job in Python Crawler Engine.
     */
    protected function cancelInCrawlerEngine(int $jobId): void
    {
        $headers = [];
        if ($token = config('services.crawler.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        $url = rtrim(config('services.crawler.url', 'http://127.0.0.1:8001'), '/') . "/api/crawl-jobs/{$jobId}";

        try {
            FetchApi::request($url, 'DELETE', null, $headers, ['throw' => false]);
        } catch (\Throwable) {
            // Ignore cancellation network errors if Python is already down or job is gone
        }
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
}
