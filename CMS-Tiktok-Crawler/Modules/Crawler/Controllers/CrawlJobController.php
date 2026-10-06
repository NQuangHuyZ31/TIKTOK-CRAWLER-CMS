<?php

namespace Modules\Crawler\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Crawler\Requests\CreateCrawlJobRequest;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawlJobController extends Controller {

    public function __construct(protected CrawlJobService $crawlJobService) {
    }

    // Get all crawl jobs
    public function getAllCrawlJobs(Request $request) {
        $params = $request->all(); // Get all query parameters

        return CrawlJobResource::collection($this->crawlJobService->getAllCrawlJobs($params['per_page'] ?? 5, $params));
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
    public function createCrawlJob(CreateCrawlJobRequest $request) {
        $data = $request->validated();
        $data['data_crawls'] = json_encode($data['data_crawl']);
        unset($data['data_crawl']);

        return $this->crawlJobService->createCrawlJob($data);
    }

    // Delete crawl job by ID
    public function deleteCrawlJobByID(int $id) {
        $result = $this->crawlJobService->deleteCrawlJobByID($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return response()->json([
            'message' => 'Crawl job deleted successfully.',
        ]);
    }

    // Get data for dashboard summary
    public function getStatisticsSummary() {
        return response()->json([
            'data' => $this->crawlJobService->getStatisticsSummary(),
        ]);
    }

    // Statrt a crawl job by ID
    public function startCrawlJobByID(int $id) {

        $result = $this->crawlJobService->startCrawlJobByID($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return response()->json([
            'message' => 'Crawl job started successfully.',
        ]);
    }
}