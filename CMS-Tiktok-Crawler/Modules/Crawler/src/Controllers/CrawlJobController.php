<?php

namespace Modules\Crawler\Controllers;

use Modules\Core\Controllers\CoreController;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawlJobController extends CoreController
{
    protected string $modelClass = CrawlJob::class;

    public function __construct(protected CrawlJobService $crawlJobService)
    {
    }

    // get rresults of crawl job by ID
    public function getResults(int $id)
    {
        $result = $this->crawlJobService->getResults($id);

        if ($result === false) {
            return $this->respondError('Crawl job not found or ID not provided.', 404);
        }

        return $this->respondSuccess(CrawlResultResource::collection($result), 'Results retrieved successfully.');
    }

    // Get data for dashboard summary
    public function getStatisticsSummary() {
        return $this->respondSuccess($this->crawlJobService->getStatisticsSummary(), 'Statistics retrieved successfully.');
    }

    // Statrt a crawl job by ID
    public function start(int $id)
    {
        $result = $this->crawlJobService->startCrawlJobByID($id);

        if ($result === false) {
            return $this->respondError('Crawl job not found, ID not provided, or the other crawl job is already running.', 404);
        }

        return $this->respondSuccess(CrawlJobResource::make($result), 'Crawl job started successfully.');
    }
}