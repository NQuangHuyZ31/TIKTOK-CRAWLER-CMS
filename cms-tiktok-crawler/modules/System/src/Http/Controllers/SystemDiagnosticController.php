<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\System\Services\SystemDiagnosticService;

class SystemDiagnosticController extends BaseController
{
    public function __construct(
        protected SystemDiagnosticService $diagnosticService
    ) {}

    /**
     * Get system environment info and diagnostic metrics.
     * api: GET /{admin_path}/api/system/system-diagnostic
     */
    public function index(Request $request): JsonResponse
    {
        $info = $this->diagnosticService->getSystemInfo();
        return $this->respondSuccess($info, 'System diagnostic information retrieved successfully.');
    }
}
