<?php

namespace Modules\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\System\Http\Requests\UpdateSystemSettingRequest;
use Modules\System\Jobs\PruneExpiredLogsJob;
use Modules\System\Models\SystemSetting;
use Modules\System\Repositories\SystemSettingRepository;
use Modules\System\Services\SystemSettingService;

class SystemSettingController extends BaseController
{
    protected string $modelClass = SystemSetting::class;
    public string $permissionModule = 'system';

    public function __construct(
        protected SystemSettingRepository $settingRepository,
        protected SystemSettingService $settingService
    ) {}

    /**
     * Get system settings by group.
     * api: GET /{admin_path}/api/system/system-setting?group=worker
     */
    public function index(Request $request): JsonResponse
    {
        $group = (string) $request->input('group', 'worker');
        $settings = $this->settingService->getGroupSettings($group);

        return $this->respondSuccess([
            'group' => $group,
            'settings' => $settings,
        ], 'System settings retrieved successfully.');
    }

    /**
     * Update settings for a given group.
     * api: POST /{admin_path}/api/system/system-setting/update-settings
     * or:  POST /{admin_path}/api/system/system-setting
     */
    public function updateSettings(UpdateSystemSettingRequest $request): JsonResponse
    {
        $group = (string) $request->input('group', 'worker');
        $payload = (array) $request->input('settings', []);

        $updated = $this->settingService->updateGroupSettings($group, $payload);

        return $this->respondSuccess([
            'group' => $group,
            'settings' => $updated,
        ], 'System settings updated successfully.');
    }

    /**
     * Trigger on-demand log pruning immediately or asynchronously via Queue Job.
     * api: POST /{admin_path}/api/system/system-setting/run-cleanup
     */
    public function runCleanup(Request $request): JsonResponse
    {
        $options = [
            'trigger' => 'manual_admin',
        ];

        if ($request->filled('activity_days')) {
            $options['activity_days'] = (int) $request->input('activity_days');
        }
        if ($request->filled('login_days')) {
            $options['login_days'] = (int) $request->input('login_days');
        }

        // Asynchronous background dispatch if requested
        if ($request->boolean('async', false)) {
            PruneExpiredLogsJob::dispatch($options);

            return $this->respondSuccess(
                ['dispatched' => true],
                'Log cleanup background job has been dispatched to the queue.'
            );
        }

        try {
            $result = $this->settingService->executeChunkedPrune($options);

            return $this->respondSuccess(
                $result,
                "Log cleanup completed successfully. Purged {$result['total_purged']} records in {$result['duration_sec']}s."
            );
        } catch (\Throwable $e) {
            return $this->respondError(
                'Log cleanup failed: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Retrieve recent log cleanup execution history.
     * api: GET /{admin_path}/api/system/system-setting/history
     */
    public function history(): JsonResponse
    {
        $history = (array) $this->settingService->getSetting('last_cleanup_history', []);

        return $this->respondSuccess(
            $history,
            'Cleanup history retrieved successfully.'
        );
    }
}
