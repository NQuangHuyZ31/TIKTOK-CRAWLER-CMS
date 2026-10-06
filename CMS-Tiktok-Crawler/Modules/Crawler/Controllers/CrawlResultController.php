<?php

namespace Modules\Crawler\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\Crawler\Services\CrawlResultService;

class CrawlResultController extends Controller
{
	public function __construct(protected CrawlResultService $crawlResultService) {}
	// get crawl result by crawl job ID
	public function getCrawlResultsByJobId(int $jobId, Request $request) {
		$params = $request->query('params', []); // Get all query parameters
		$per_page = $request->query('per_page', 5);

		return CrawlResultResource::collection($this->crawlResultService->getCrawlResultsByJobId($jobId, $per_page, $params));
	}
}