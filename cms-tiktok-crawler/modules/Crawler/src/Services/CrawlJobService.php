<?php

namespace Modules\Crawler\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Core\Utils\FetchApi;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\System\Facades\Audit;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlJobService
{
    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository,
        protected CrawlResultRepositoryInterface $crawlResultRepository
    ) {
    }

    /**
     * Domain logic: Create a new crawl job.
     */
    public function create(array $data): CrawlJob
    {
        $sourceType = $data['source_type'] ?? 'usernames';
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
            'data_crawls' => json_encode($dataCrawl),
            'total_accounts' => $totalAccounts,
            'status' => 'pending',
            'success_count' => 0,
            'failed_count' => 0,
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
     * Domain logic: Start a crawl job (complex orchestration across DB, TiktokAccount repository, and Python crawler engine).
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

        if ($this->crawlJobRepository->hasRunningJob($id)) {
            throw new \DomainException('Another crawl job is currently running, please wait for it to complete.');
        }

        try {
            $payload = $this->buildCrawlerPayload($id, $crawlJob);

            $this->crawlJobRepository->update($id, [
                'status' => 'running',
                'started_at' => now(),
            ]);

            $this->dispatchToCrawlerEngine($payload);

            Audit::record(
                action: 'CRAWL',
                target: 'job_crawl_' . $id,
                metadata: [
                    'source_type' => $crawlJob->source_type,
                    'total_accounts' => $crawlJob->total_accounts,
                    'trigger_by' => 'manual',
                ],
                status: 'SUCCESS',
                module: 'TIKTOK',
                recordType: 'CrawlJob'
            );

            return $this->crawlJobRepository->findById($id);
        } catch (\Throwable $exception) {
            $this->markCrawlJobAsFailed($id, $exception->getMessage());
            throw $exception;
        }
    }

    /**
     * Domain logic: Retry a failed crawl job.
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

        if ($this->crawlJobRepository->hasRunningJob($id)) {
            throw new \DomainException('Another crawl job is currently running, please wait for it to complete.');
        }

        try {
            $payload = $this->buildCrawlerPayload($id, $crawlJob);

            // Clean up existing results from previous failed attempt
            $crawlJob->results()->delete();

            $this->crawlJobRepository->update($id, [
                'status' => 'running',
                'error_message' => null,
                'started_at' => now(),
                'finished_at' => null,
                'success_count' => 0,
                'failed_count' => 0,
            ]);

            $this->dispatchToCrawlerEngine($payload);

            Audit::record(
                action: 'RETRY_CRAWL',
                target: 'job_crawl_' . $id,
                metadata: [
                    'retry_count' => ($crawlJob->retry_count ?? 1),
                    'trigger_by' => 'manual',
                    'source_type' => $crawlJob->source_type,
                ],
                status: 'SUCCESS',
                module: 'TIKTOK',
                recordType: 'CrawlJob'
            );

            return $this->crawlJobRepository->findById($id);
        } catch (\Throwable $exception) {
            $this->markCrawlJobAsFailed($id, $exception->getMessage());
            throw $exception;
        }
    }

    /**
     * Dispatch payload to external Python Crawler Engine.
     */
    protected function dispatchToCrawlerEngine(array $payload): void
    {
        $headers = [];
        if ($token = config('services.crawler.token')) {
            $headers['Authorization'] = "Bearer {$token}";
        }

        FetchApi::post(
            rtrim(config('services.crawler.url', 'http://127.0.0.1:8001'), '/') . '/api/crawl-jobs/start',
            $payload,
            $headers
        );
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

        if ($crawlJob->source_type === 'database') {
            $usernames = $this->tiktokAccountRepository->getUsernamesByIds($data);

            if (empty($usernames)) {
                throw new \RuntimeException('No matching TikTok accounts found in the database.');
            }

            return [
                'job_id' => $jobId,
                'source_type' => 'usernames',
                'usernames' => $usernames,
            ];
        }

        return match ($crawlJob->source_type) {
            'usernames' => [
                'job_id' => $jobId,
                'source_type' => 'usernames',
                'usernames' => $data,
            ],
            'urls' => [
                'job_id' => $jobId,
                'source_type' => 'urls',
                'urls' => $data,
            ],
            'count' => [
                'job_id' => $jobId,
                'source_type' => 'count',
                'total_accounts' => (int) ($data[0] ?? $crawlJob->total_accounts ?? 0),
            ],
            default => throw new \InvalidArgumentException("Unsupported crawl source type: {$crawlJob->source_type}"),
        };
    }

    protected function markCrawlJobAsFailed(int $id, string $message): void
    {
        $this->crawlJobRepository->update($id, [
            'status' => 'failed',
            'error_message' => $message,
            'finished_at' => now(),
        ]);

        Audit::record(
            action: 'CRAWL_FAILED',
            target: 'job_crawl_' . $id,
            metadata: ['trigger_by' => 'system'],
            status: 'FAILED',
            errorMessage: $message,
            module: 'TIKTOK',
            recordType: 'CrawlJob'
        );
    }
}
