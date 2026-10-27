<?php

namespace Modules\Crawler\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Http\Requests\StoreCrawlJobRequest;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawlJobController extends BaseController
{
    protected string $modelClass = CrawlJob::class;
    protected ?string $resourceClass = CrawlJobResource::class;
    protected array $searchableColumns = ['source_type', 'status', 'error_message'];
    protected array $filterableColumns = ['status', 'source_type','started_at', 'finished_at'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected CrawlResultRepositoryInterface $crawlResultRepository,
        protected CrawlJobService $crawlJobService
    ){}

    /**
     * REST Action: store (POST /{module}/crawl-job)
     * Simple business logic: validates payload, calculates total accounts, creates record directly via repository.
     */
    public function store(Request $request) :JsonResponse
    {
        $validated = app(StoreCrawlJobRequest::class)->validated();
        $sourceType = $validated['source_type'] ?? 'usernames';
        $dataCrawl = $validated['data_crawl'] ?? [];

        if (is_string($dataCrawl)) {
            $decoded = json_decode($dataCrawl, true);
            $dataCrawl = is_array($decoded) ? $decoded : [$dataCrawl];
        }

        $totalAccounts = match ($sourceType) {
            'usernames', 'urls', 'database' => count($dataCrawl),
            'count' => (int) ($dataCrawl[0] ?? $validated['total_accounts'] ?? 0),
            default => count($dataCrawl),
        };

        $job = $this->crawlJobRepository->create([
            'source_type' => $sourceType,
            'data_crawls' => json_encode($dataCrawl),
            'total_accounts' => $totalAccounts,
            'status' => 'pending',
            'success_count' => 0,
            'failed_count' => 0,
        ]);

        return $this->respondSuccess(new CrawlJobResource($job), 'Resource created successfully.', 201);
    }

    /**
     * REST Action: update (PUT/PATCH /{module}/crawl-job/{id})
     * Simple business logic: ensures job is pending, updates attributes directly via repository.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $job = $this->crawlJobRepository->findById((int) $id);
        if (!$job) {
            return $this->respondError('Crawl job not found.', 404);
        }

        if ($job->status !== 'pending') {
            return $this->respondError('Only pending crawl jobs can be updated.', 422);
        }

        $data = $request->all();
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
            $this->crawlJobRepository->update((int) $id, $updateData);
            $job = $this->crawlJobRepository->findById((int) $id);
        }

        return $this->respondSuccess(new CrawlJobResource($job), 'Crawl job updated successfully.');
    }

    /**
     * REST Action: destroy (DELETE /{module}/crawl-job/{id})
     * Simple business logic: ensures job is not running, deletes record directly via repository.
     */
    public function destroy(int|string $id): JsonResponse
    {
        $job = $this->crawlJobRepository->findById((int) $id);
        if (!$job) {
            return $this->respondError('Crawl job not found.', 404);
        }

        if ($job->status === 'running') {
            return $this->respondError('Cannot delete a running crawl job.', 422);
        }

        $this->crawlJobRepository->delete((int) $id);

        return $this->respondSuccess(null, 'Crawl job deleted successfully.');
    }

    /**
     * REST Custom Action: start (POST /{module}/crawl-job/{id}/start)
     * Complex orchestration logic: delegated to CrawlJobService.
     */
    public function start(int $id)
    {
        try {
            $result = $this->crawlJobService->start((int) $id);
            if (!$result) {
                return $this->respondError('Crawl job not found or cannot be started.', 400);
            }
            return $this->respondSuccess(new CrawlJobResource($result), 'Crawl job started successfully.');
        } catch (\DomainException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * REST Custom Action: retry (POST /{module}/crawl-job/{id}/retry)
     * Complex orchestration logic: delegated to CrawlJobService.
     */
    public function retry(int $id): JsonResponse
    {
        try {
            $result = $this->crawlJobService->retry((int) $id);
            if (!$result) {
                return $this->respondError('Crawl job not found or cannot be retried.', 404);
            }
            return $this->respondSuccess(new CrawlJobResource($result), 'Crawl job retried successfully.');
        } catch (\DomainException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 500);
        }
    }

    /**
     * REST Custom Query: statisticsSummary (GET /{module}/crawl-job/statistics-summary)
     * Pure database aggregation: queries CrawlJobRepository directly without service layer.
     */
    public function getStatisticsSummary()
    {
        return $this->respondSuccess(
            $this->crawlJobRepository->getStatisticsSummary(),
            'Statistics retrieved successfully.'
        );
    }

    /**
     * REST Sub-resource: results (GET /{module}/crawl-job/{id}/results)
     * Pure database query: fetches job results directly via CrawlResultRepository.
     */
    public function results(int $id, Request $request)
    {
        $job = $this->crawlJobRepository->findById($id);
        if (!$job) {
            return $this->respondError('Crawl job not found.', 404);
        }

        $perPage = (int) $request->input('per_page', 10);
        $results = $this->crawlResultRepository->getByJobId($id, $perPage, $request->all());

        return $this->respondSuccess(CrawlResultResource::collection($results), 'Crawl results retrieved successfully.');
    }
}
