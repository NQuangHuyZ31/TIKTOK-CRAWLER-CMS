<?php

namespace Modules\API\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Services\CrawlerSeedChangeService;

class CrawlerSeedSyncController extends BaseController
{
    public function __construct(
        private readonly CrawlerSeedChangeService $seedChangeService
    ) {}

    /**
     * Endpoint to retrieve commit-ordered seed changes for SQLite candidate pool synchronization.
     * Route: GET /admin/api/public/crawler/seeds/changes?since_sequence=0&limit=100
     */
    public function getChanges(Request $request): JsonResponse
    {
        $sinceSequence = max(0, (int) $request->query('since_sequence', 0));
        $limit = max(1, min(500, (int) $request->query('limit', 100)));

        $data = $this->seedChangeService->getChangesAfter($sinceSequence, $limit);

        return $this->respondSuccess($data, 'Seed changes retrieved successfully.');
    }
}
