<?php

namespace Modules\TiktokAccount\Controllers;

use Illuminate\Http\Request;
use Modules\Core\Controllers\CoreController;
use Modules\Crawler\Models\CrawlResult;
use Modules\Crawler\Resources\CrawlResultResource;
use Modules\TiktokAccount\Services\TiktokAccountService;

class TiktokAccountController extends CoreController {
    protected string $modelClass = CrawlResult::class;
    protected string $resourceClass = CrawlResultResource::class;

    public function __construct(protected TiktokAccountService $tiktokAccountService) {

    }

    // Get crawl results for a specific TikTok account
	public function results(int $id, Request $request) {
		$params = $request->all(); // Get all query parameters
		$per_page = $params['per_page'] ?? 5; // Default to 5 if not provided

		$results = $this->tiktokAccountService->getCrawlResults($id, $per_page, $params);

		if ($results === false) {
			return response()->json(['message' => 'Invalid account ID or account does not exist.'], 400);
		}
		
		return CrawlResultResource::collection($results);
	}

    public function getStatisticSummary() {
        return response()->json($this->tiktokAccountService->getStatisticSummary());
    }
}