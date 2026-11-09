<?php

namespace Modules\API\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Services\CrawlerWebhookIngestionService;

class CrawlerBatchWebhookController extends BaseController
{
    public function __construct(
        private readonly CrawlerWebhookIngestionService $ingestionService
    ) {}

    /**
     * Webhook endpoint to receive and process durable Outbox batches from Python Crawler Service.
     */
    public function handleBatch(Request $request): JsonResponse
    {
        $result = $this->ingestionService->handleBatchWebhook($request);

        return response()->json($result['body'], $result['status_code']);
    }
}
