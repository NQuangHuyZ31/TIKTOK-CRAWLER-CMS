<?php

namespace Modules\Core\Http\Controllers;

use Illuminate\Http\JsonResponse;

class CoreController extends BaseController
{
    public array $publicActions = ['metadata'];

    /**
     * Get core system metadata including active modules, standard actions, and common actions.
     * api: GET /{admin_path}/api/core/metadata
     */
    public function metadata(): JsonResponse
    {
        $isDev = (bool) config('modules.enable_dev', false);
        $modules = config('modules.modules', []);
        $permissionActions = config('modules.permission_actions', []);
        $protected = config('modules.protected', []);
        $devOnlyActions = config('modules.dev_only_actions', []);
        $moduleMetadata = config('modules.module_metadata', []);
        $ignoreGroup = config('modules.ignore_group', []);

        // Filter out dev-only modules if not in dev mode
        if (!$isDev) {
            $devModules = config('modules.dev_modules', ['module_manager']);
            $modules = array_values(array_diff($modules, $devModules));
            unset($moduleMetadata['module_manager']);
        }

        return $this->respondSuccess([
            'modules' => array_values($modules),
            'permission_actions' => array_values($permissionActions),
            'protected_modules' => array_values($protected),
            'ignore_group' => array_values($ignoreGroup),
            'module_metadata' => $moduleMetadata,
            'dev_only_actions' => $devOnlyActions,
            'enable_dev' => $isDev,
        ], 'Core system metadata retrieved successfully.');
    }
}
