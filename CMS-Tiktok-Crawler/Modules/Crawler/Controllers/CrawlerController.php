<?php

namespace Modules\Crawler\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Request;
use Modules\Crawler\Services\CrawlJobService;

class CrawlerController extends Controller {

    public function __construct(protected CrawlJobService $crawlJobService) {
    }

    public function getAllCrawlJobs() {
        return response()->json([
            'data' => $this->crawlJobService->getAllCrawlJobs(),
        ]);
    }

    public function getDashboardSummary() {
        return response()->json([
            'data' => $this->crawlJobService->getDashboardSummary(),
        ]);
    }

    // public function show($id) {

    // }

    // public function update(Request $request, $id) {

    // }

    // public function destroy($id) {

    // }
}