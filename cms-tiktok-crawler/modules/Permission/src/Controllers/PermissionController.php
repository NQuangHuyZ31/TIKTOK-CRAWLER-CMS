<?php

namespace Modules\Permission\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Controllers\BaseController;
use Modules\Permission\Models\Permission;
use Modules\Permission\Resources\PermissionResource;
use Modules\Permission\Services\PermissionService;

class PermissionController extends BaseController
{
    protected string $modelClass = Permission::class;
    protected string $resourceClass = PermissionResource::class;
    protected array $searchableColumns = ['name', 'slug', 'module', 'action'];
    protected array $filterableColumns = ['module', 'action'];

    public function __construct(
        protected PermissionService $permissionService
    ) {}

    /**
     * Get list of all permissions with filtering and pagination.
     * api: /admin/api/permission/permission
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request)
    {
        return parent::index($request);
    }

    /**
     * Get permissions matrix grouped by module.
     * api: /admin/api/permission/permission/modules
     *
     * @return JsonResponse
     */
    public function modules(): JsonResponse
    {
        $grouped = $this->permissionService->getGroupedPermissions();
        return $this->respondSuccess($grouped, 'Module permissions retrieved successfully.');
    }
}
