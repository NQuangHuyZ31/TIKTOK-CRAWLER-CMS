<?php

namespace Modules\ModuleManager\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Core\Http\Controllers\BaseController;
use Modules\ModuleManager\Http\Requests\ScaffoldModuleRequest;
use Modules\ModuleManager\Http\Requests\UpdateModuleVisibilityRequest;
use Modules\ModuleManager\Services\ModuleManagerService;

class ModuleManagerController extends BaseController
{
    public string $permissionModule = 'system';

    public function __construct(
        protected ModuleManagerService $moduleManagerService
    ) {}

    /**
     * Get list of currently hidden modules.
     * GET /{admin_path}/api/module-manager/visibility
     */
    public function visibility(): JsonResponse
    {
        $hidden = $this->moduleManagerService->getHiddenModules();

        return $this->respondSuccess([
            'hidden_modules' => $hidden,
        ], 'Module visibility settings retrieved successfully.');
    }

    /**
     * Update hidden modules list.
     * POST /{admin_path}/api/module-manager/visibility
     */
    public function updateVisibility(UpdateModuleVisibilityRequest $request): JsonResponse
    {
        $hidden = (array) $request->input('hidden_modules', []);
        $updated = $this->moduleManagerService->updateHiddenModules($hidden);

        return $this->respondSuccess([
            'hidden_modules' => $updated,
        ], 'Module visibility settings updated successfully.');
    }

    /**
     * Scaffold a new module and optionally its basic permissions.
     * POST /{admin_path}/api/module-manager/scaffold
     */
    public function scaffold(ScaffoldModuleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->moduleManagerService->scaffold($validated);

            return $this->respondSuccess($result, 'Module scaffolded successfully.', 201);
        } catch (\Throwable $e) {
            return $this->respondError('Failed to scaffold module: ' . $e->getMessage(), 400);
        }
    }
}
