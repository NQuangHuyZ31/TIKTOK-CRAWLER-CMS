<?php

namespace Modules\System\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Controllers\BaseController;
use Modules\System\Models\SystemSetting;
use Modules\System\Repositories\SystemSettingRepository;
use Modules\System\Resources\SystemSettingResource;
use Modules\System\Services\SystemSettingService;

class SystemSettingController extends BaseController
{
    protected string $modelClass = SystemSetting::class;
    protected string $resourceClass = SystemSettingResource::class;
    protected array $searchableColumns = ['key', 'group', 'description'];
    protected array $filterableColumns = ['group', 'type', 'is_public'];

    public function __construct(
        protected SystemSettingService $settingService,
        protected SystemSettingRepository $settingRepository
    ) {}

    /**
     * Get list of settings or all grouped key-values if all=true.
     * api: /admin/api/system/system-setting
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request)
    {
        if ($request->boolean('grouped')) {
            $grouped = $this->settingService->getGroupedSettings();
            return $this->respondSuccess($grouped, 'Grouped system settings retrieved successfully.');
        }

        return parent::index($request);
    }

    /**
     * Get settings belonging to a specific group category.
     * api: /admin/api/system/system-setting/group/{group}
     *
     * @param string $group
     * @return JsonResponse
     */
    public function group(string $group): JsonResponse
    {
        $settings = $this->settingService->getSettingsByGroup($group);
        return $this->respondSuccess($settings, "Settings for group '{$group}' retrieved successfully.");
    }

    /**
     * Batch update multiple system settings.
     * api: /admin/api/system/system-setting/batch-update
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function batchUpdate(Request $request): JsonResponse
    {
        $settings = $request->input('settings', $request->all());

        if (!is_array($settings)) {
            return $this->respondError('Settings payload must be an array of key-value pairs.', 422);
        }

        $group = $request->input('group', 'general');
        $this->settingService->batchUpdate($settings, $group);

        return $this->respondSuccess(
            $this->settingService->getGroupedSettings(),
            'System settings updated successfully.'
        );
    }

    /**
     * Get system environment information and diagnostics.
     * api: /admin/api/system/system-setting/info
     *
     * @return JsonResponse
     */
    public function info(): JsonResponse
    {
        $info = $this->settingService->getSystemInfo();
        return $this->respondSuccess($info, 'System environment info retrieved successfully.');
    }
}
