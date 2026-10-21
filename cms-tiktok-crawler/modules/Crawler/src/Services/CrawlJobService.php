<?php

namespace Modules\Crawler\Services;

use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Utils\FetchAPIUtil;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;

class CrawlJobService {
    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected TiktokAccountRepositoryInterface $tiktokAccountRepository
    ) {
    }

    public function getAll(int $per_page, array $params = []) {
        return $this->crawlJobRepository->getAll($per_page, $params);
    }

    public function create(array $data) {
        return $this->crawlJobRepository->create($data);
    }

    public function update(int $id, array $data) {
        $crawlJob = $this->crawlJobRepository->getCrawlJobById($id);

        if ($crawlJob === null || $crawlJob->status !== 'pending') {
            return false;
        }

        return $this->crawlJobRepository->update($id, $data);
    }

    public function getDetails(int $id) {
        return !$id || $this->crawlJobRepository->getCrawlJobById($id) === null
        ? false
        : $this->crawlJobRepository->getCrawlJobById($id);
    }

    public function delete(int $id) {
        if (!$id || $this->crawlJobRepository->getCrawlJobById($id) === null) {
            return false;
        }

        if ($this->crawlJobRepository->getCrawlJobByStatus($id, 'running')->count() > 0) {
            return false;
        }

        $this->crawlJobRepository->delete($id);
        return true;
    }

    public function getStatisticsSummary(): array {
        return $this->crawlJobRepository->getStatisticsSummary();
    }

    // get crawl results by crawl job ID
    public function getResults(int $id) {
        if (!$id || $this->crawlJobRepository->getCrawlJobById($id) === null) {
            return false;
        }

        return $this->crawlJobRepository->getResults($id);
    }

    // Start a crawl job by ID
    public function startCrawlJobById(int $id) {
        $crawlJob = $this->crawlJobRepository->getCrawlJobById($id);

        if (!$id || $crawlJob === null || in_array($crawlJob->status, ['completed', 'failed', 'running'], true)) {
            return false;
        }

        if ($this->crawlJobRepository->getCrawlJobByStatus(0, 'running')->count() > 0) {
            return false;
        }

        try {
            $payload = $this->buildCrawlerPayload($id, $crawlJob);
            $result = $this->crawlJobRepository->update($id, [
                'status' => 'running',
                'started_at' => now(),
            ]);

            if (!$result) {
                return false;
            }

            $headers = [];
            if ($token = config('services.crawler.token')) {
                $headers['Authorization'] = "Bearer {$token}";
            }

            FetchAPIUtil::fetchAPI(
                rtrim(config('services.crawler.url'), '/') . '/api/crawl-jobs/start',
                'POST',
                $payload,
                $headers
            );

            return $result;
        } catch (\Throwable $exception) {
            $this->markCrawlJobAsFailed($id, $exception->getMessage());
            return false;
        }
    }

    private function buildCrawlerPayload(int $jobId, object $crawlJob): array {
        $data = json_decode($crawlJob->data_crawls, true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data) || $data === []) {
            throw new \InvalidArgumentException('Crawl job data must be a non-empty array.');
        }

        if ($crawlJob->source_type === 'database') {
            $usernames = $this->tiktokAccountRepository->getUsernamesByIds($data);

            if (count($usernames) !== count($data)) {
                throw new \RuntimeException('One or more selected TikTok accounts were not found.');
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
                'total_accounts' => (int) ($data[0] ?? 0),
            ],
            default => throw new \InvalidArgumentException(
                "Unsupported crawler source type: {$crawlJob->source_type}"
            ),
        };
    }

    private function markCrawlJobAsFailed(int $id, string $message): void {
        $this->crawlJobRepository->update($id, [
            'status' => 'failed',
            'error_message' => $message,
        ]);
    }
}
