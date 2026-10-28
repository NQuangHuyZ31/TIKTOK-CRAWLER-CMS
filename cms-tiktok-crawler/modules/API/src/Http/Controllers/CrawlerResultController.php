<?php

namespace Modules\API\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Modules\API\Http\Requests\CrawlerResultStoreRequest;
use Modules\Crawler\Services\CrawlResultService;

class CrawlerResultController extends Controller
{
    public function __construct(
        private readonly CrawlResultService $crawlResultService
    ) {
    }

    public function saveResult(
        CrawlerResultStoreRequest $request,
        int $jobId
    ): JsonResponse {
        $data = $request->validated();

        if ((int) $data['job_id'] !== $jobId) {
            return response()->json([
                'message' => 'The route job_id does not match the payload job_id.',
            ], 422);
        }

        $result = $this->crawlResultService->handleWebhookEvent($jobId, $data);

        return response()->json($result['body'], $result['status_code']);
    }
}
