<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Core\Http\Controllers\BaseController;
use Modules\System\Models\ActivityLog;
use Modules\System\Resources\ActivityLogResource;
use Modules\System\Services\ActivityLogService;

class ActivityLogController extends BaseController
{
    protected string $modelClass = ActivityLog::class;
    protected ?string $resourceClass = ActivityLogResource::class;
    protected array $searchableColumns = ['user_email', 'user_role', 'action', 'module', 'record_id', 'record_type', 'error_message'];
    protected array $filterableColumns = ['action', 'module', 'status', 'user_id', 'record_type'];
    protected array $defaultSort = ['id', 'desc'];

    public function __construct(
        protected ActivityLogService $activityLogService
    ) {}

    /**
     * Get aggregate statistics of activity logs.
     * api: GET /{admin_path}/api/system/activity-log/statistics
     */
    public function statistics(): JsonResponse
    {
        return $this->respondSuccess(
            $this->activityLogService->getStatistics(),
            'Activity statistics retrieved successfully.'
        );
    }
}
