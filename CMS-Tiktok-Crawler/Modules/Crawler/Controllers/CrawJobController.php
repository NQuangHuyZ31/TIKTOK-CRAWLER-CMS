<?php

namespace Modules\Crawler\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawJobController extends Controller {

    public function __construct(protected CrawlJobService $crawlJobService) {
    }

    // Get all crawl jobs
    public function getAllCrawlJobs() {
        return CrawlJobResource::collection($this->crawlJobService->getAllCrawlJobs());
    }

    // Get details of crawl job by ID
    public function getCrawlJobById(int $id) {
        $result = $this->crawlJobService->getCrawlJobById($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return CrawlJobResource::make($result);
    }

    // Create a new crawl job
    public function createCrawlJob(Request $request) {
        return $this->crawlJobService->createCrawlJob($request->all());
    }

    // Get crawl results by job ID
    public function getCrawlResultsByJobId(int $id) {
        $result = $this->crawlJobService->getCrawlJobById($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        $crawlResults = $this->crawlJobService->getCrawlResultsByJobId($id);
        return CrawlResultResource::collection($crawlResults);
    }

    // Get data for dashboard summary
    public function getDashboardSummary() {
        return response()->json([
            'data' => $this->crawlJobService->getDashboardSummary(),
        ]);
    }
}