<?php

namespace Modules\Crawler\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Http\Requests\StoreCrawlJobRequest;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawlJobController extends BaseController
{
    protected string $modelClass = CrawlJob::class;
    protected ?string $resourceClass = CrawlJobResource::class;
    protected array $searchableColumns = ['source_type', 'status', 'error_message'];
    protected array $filterableColumns = ['status', 'source_type', 'started_at', 'finished_at'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected CrawlJobService $crawlJobService
    ) {
    }

    /**
     * REST Action: store (POST /{module}/crawl-job)
     * Delegated to CrawlJobService.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(StoreCrawlJobRequest::class)->validated();
        $job = $this->crawlJobService->create($validated);

        return $this->respondSuccess(new CrawlJobResource($job), 'Resource created successfully.', 201);
    }

    /**
     * REST Action: update (PUT/PATCH /{module}/crawl-job/{id})
     * Delegated to CrawlJobService.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        try {
            $job = $this->crawlJobService->update((int) $id, $request->all());
            if (!$job) {
                return $this->respondError('Crawl job not found.', 404);
            }

            return $this->respondSuccess(new CrawlJobResource($job), 'Crawl job updated successfully.');
        } catch (\DomainException $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * REST Action: destroy (DELETE /{module}/crawl-job/{id})
     * Delegated to CrawlJobService.
     */
    public function destroy(int|string $id): JsonResponse
    {
        try {
            $deleted = $this->crawlJobService->delete((int) $id);
            if (!$deleted) {
                return $this->respondError('Crawl job not found.', 404);
            }

            return $this->respondSuccess(null, 'Crawl job deleted successfully.');
        } catch (\DomainException $e) {
            return $this->respondError($e->getMessage(), 422);
        }
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
     * Delegated to CrawlJobService.
     */
    public function getStatisticsSummary(): JsonResponse
    {
        return $this->respondSuccess(
            $this->crawlJobService->getStatisticsSummary(),
            'Statistics retrieved successfully.'
        );
    }

    /**
     * REST Sub-resource: results (GET /{module}/crawl-job/{id}/results)
     * Delegated to CrawlJobService.
     */
    public function results(int $id, Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $results = $this->crawlJobService->getJobResults($id, $perPage, $request->all());
        if ($results === null) {
            return $this->respondError('Crawl job not found.', 404);
        }

        return $this->respondSuccess(CrawlResultResource::collection($results), 'Crawl results retrieved successfully.');
    }
}
