<?php

namespace Modules\Crawler\Controllers;

use Illuminate\Http\Request;
use Modules\Core\Controllers\CoreController;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Repositories\Interfaces\CrawlResultRepositoryInterface;
use Modules\Crawler\Resources\CrawlResultResource;

class CrawlResultController extends CoreController
{
    protected string $modelClass = CrawlResult::class;
    protected string $resourceClass = CrawlResultResource::class;
    protected array $searchableColumns = ['username', 'profile_url', 'status'];
    protected array $filterableColumns = ['crawl_job_id', 'status', 'tiktok_account_id'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected CrawlResultRepositoryInterface $crawlResultRepository
    ) {
    }

    /**
     * REST sub-action: Retrieve paginated crawl results for a specific job.
     */
    public function byJob(int $jobId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $results = $this->crawlResultRepository->getByJobId($jobId, $perPage, $request->all());

        return $this->respondSuccess(CrawlResultResource::collection($results), 'Crawl results retrieved successfully.');
    }
}