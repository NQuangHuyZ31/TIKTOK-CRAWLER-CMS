<?php

namespace Modules\Crawler\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlResultService;

class CrawlResultController extends BaseController
{
    protected string $modelClass = CrawlResult::class;
    protected ?string $resourceClass = CrawlResultResource::class;
    protected array $searchableColumns = ['username', 'profile_url', 'status'];
    protected array $filterableColumns = ['crawl_job_id', 'status', 'tiktok_account_id'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected CrawlResultService $crawlResultService
    ) {
    }

    /**
     * Retrieve paginated crawl results for a specific job.
     */
    public function byJob(int $jobId, Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $results = $this->crawlResultService->getByJobId($jobId, $perPage, $request->all());
        $results->through(fn($item) => new CrawlResultResource($item));

        return $this->respondPaginated($results, 'Crawl results retrieved successfully.');
    }
}
