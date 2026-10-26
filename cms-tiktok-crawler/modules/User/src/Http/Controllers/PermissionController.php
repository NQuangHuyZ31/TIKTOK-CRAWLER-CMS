<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Permission\Models\Permission;
use Modules\Permission\Resources\PermissionResource;
use Modules\Permission\Services\PermissionService;

class PermissionController extends BaseController
{
    public string $permissionModule = 'permission';

    protected string $modelClass = Permission::class;
    protected ?string $resourceClass = PermissionResource::class;
    protected array $searchableColumns = ['name', 'slug', 'module', 'action'];
    protected array $filterableColumns = ['module', 'action'];

    public function __construct(
        protected PermissionService $permissionService
    ) {}

    /**
     * Get list of all permissions with filtering and pagination.
     * api: GET /admin/api/user/permission
     */
    public function index(Request $request): JsonResponse
    {
        return parent::index($request);
    }

    /**
     * Get permissions matrix grouped by module.
     * api: GET /admin/api/user/permission/modules
     */
    public function modules(): JsonResponse
    {
        $grouped = $this->permissionService->getGroupedPermissions();
        return $this->respondSuccess($grouped, 'Module permissions retrieved successfully.');
    }
}
