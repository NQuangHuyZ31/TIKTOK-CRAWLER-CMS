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
    public function getAll(Request $request) {
        $params = $request->all(); // Get all query parameters

        return CrawlJobResource::collection($this->crawlJobService->getAll($params['per_page'] ?? 5, $params));
    }

    // Get details of crawl job by ID
    public function getDetails(int $id) {
        $result = $this->crawlJobService->getDetails($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return CrawlJobResource::make($result);
    }

    // Create a new crawl job
    public function add(CreateCrawlJobRequest $request) {
        $data = $request->validated();
        $data['data_crawls'] = json_encode($data['data_crawl']);
        unset($data['data_crawl']);

        $result = $this->crawlJobService->create($data);

        return response()->json([
            'message' => 'Crawl job created successfully.',
            'data' => CrawlJobResource::make($result),
        ], 201);
    }

    public function update(CreateCrawlJobRequest $request, int $id) {
        $data = $request->validated();
        $data['data_crawls'] = json_encode($data['data_crawl']);
        unset($data['data_crawl']);

        $result = $this->crawlJobService->update($id, $data);

        if ($result === false) {
            return response()->json([
                'message' => 'Only pending crawl jobs can be updated.',
            ], 422);
        }

        return response()->json([
            'message' => 'Crawl job updated successfully.',
            'data' => CrawlJobResource::make($result),
        ]);
    }

    // Delete crawl job by ID
    public function delete(int $id) {
        $result = $this->crawlJobService->delete($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return response()->json([
            'message' => 'Crawl job deleted successfully.',
        ]);
    }

    // get rresults of crawl job by ID
    public function getResults(int $id) {
        $result = $this->crawlJobService->getResults($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found or ID not provided.',
            ], 404);
        }

        return CrawlResultResource::collection($result);
    }

    // Get data for dashboard summary
    public function getStatisticsSummary() {
        return response()->json([
            'data' => $this->crawlJobService->getStatisticsSummary(),
        ]);
    }

    // Statrt a crawl job by ID
    public function start(int $id) {

        $result = $this->crawlJobService->startCrawlJobByID($id);

        if ($result === false) {
            return response()->json([
                'message' => 'Crawl job not found, ID not provided, or the other crawl job is already running.',
            ], 404);
        }

        return response()->json([
            'message' => 'Crawl job started successfully.',
            'data' => CrawlJobResource::make($result),
        ]);
    }
}