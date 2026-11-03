<?php

namespace Modules\API\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\API\Http\Requests\CrawlerResultStoreRequest;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Services\CrawlJobService;
use Modules\Crawler\Services\CrawlResultService;

class CrawlerResultController extends BaseController
{
    public function __construct(
        private readonly CrawlResultService $crawlResultService,
        private readonly CrawlJobService $crawlJobService
    ) {
    }

    /**
     * Webhook endpoint to receive and process crawler execution events.
     * Route: POST /admin/api/public/crawler/crawl-jobs/{jobId}/events
     */
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

    /**
     * Endpoint to retrieve unfinished ('running', 'queued') jobs for worker crash recovery.
     * Route: GET /admin/api/public/crawler/jobs/unfinished
     */
    public function unfinishedJobs(): JsonResponse
    {
        return $this->respondSuccess(
            $this->crawlJobService->getUnfinishedJobsForRecovery(),
            'Unfinished crawl jobs retrieved successfully.'
        );
    }
}
