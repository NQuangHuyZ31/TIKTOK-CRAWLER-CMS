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
     * Retrieve aggregated statistics for Dashboard (Crawl jobs, TikTok accounts, recent activities, growth trends).
     * API: GET /core/dashboard?days=30
     */
    public function index(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        return $this->respondSuccess(
            $this->dashboardService->getOverviewData($days),
            'Dashboard overview data retrieved successfully.'
        );
    }

    /**
     * Alias for retrieving aggregated overview statistics.
     * API: GET /core/dashboard/overview?days=30
     */
    public function overview(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        return $this->respondSuccess(
            $this->dashboardService->getOverviewData($days),
            'Dashboard overview data retrieved successfully.'
        );
    }

    /**
     * Retrieve Followers and Likes growth time series data for charts.
     * API: GET /core/dashboard/growth?days=30
     */
    public function growth(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        return $this->respondSuccess(
            $this->dashboardService->getGrowthTrends($days),
            'Growth trends retrieved successfully.'
        );
    }
}
