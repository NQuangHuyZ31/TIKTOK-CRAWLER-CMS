<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Services\DashboardService;

class DashboardController extends BaseController
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    /**
     * Retrieve aggregated statistics for Dashboard (Crawl jobs, TikTok accounts, recent activities).
     * API: GET /core/dashboard
     */
    public function index(Request $request): JsonResponse
    {
        return $this->respondSuccess(
            $this->dashboardService->getOverviewData(),
            'Dashboard overview data retrieved successfully.'
        );
    }

    /**
     * Alias for retrieving aggregated overview statistics.
     * API: GET /core/dashboard/overview
     */
    public function overview(Request $request): JsonResponse
    {
        return $this->respondSuccess(
            $this->dashboardService->getOverviewData(),
            'Dashboard overview data retrieved successfully.'
        );
    }
}
