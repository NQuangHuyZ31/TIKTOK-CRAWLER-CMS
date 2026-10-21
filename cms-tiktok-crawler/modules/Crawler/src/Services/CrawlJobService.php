<?php

namespace Modules\Crawler\Services;

use Modules\Core\Utils\FetchApi;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlJobService
{
    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository
    ) {
    }

    /**
     * Domain logic: Start a crawl job (complex orchestration across DB, TiktokAccount repository, and Python crawler engine).
     * Rules:
     * - Only 'pending' jobs can be started.
     * - Only 1 active running job is allowed system-wide at any given time.
     * - For 'database' sources: resolves account IDs to actual TikTok usernames via TiktokAccountRepository.
     * - Dispatches API call to external Python Crawler Engine. Marks job 'failed' with error_message upon exception.
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

            $headers = [];
            if ($token = config('services.crawler.token')) {
                $headers['Authorization'] = "Bearer {$token}";
            }

            FetchApi::post(
                rtrim(config('services.crawler.url', 'http://127.0.0.1:8001'), '/') . '/api/crawl-jobs/start',
                $payload,
                $headers
            );

            $startedJob = $this->crawlJobRepository->findById($id);
            return $startedJob;
        } catch (\Throwable $exception) {
            $this->markCrawlJobAsFailed($id, $exception->getMessage());
            throw $exception;
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
    }
}
