<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Permission\Http\Requests\CreateModulePermissionsRequest;
use Modules\Permission\Http\Requests\StorePermissionRequest;
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
    protected array $defaultSort = ['module', 'asc'];

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
     * Create a single new permission.
     * api: POST /admin/api/user/permission
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(StorePermissionRequest::class)->validated();

        try {
            $permission = $this->permissionService->createPermission($validated);
            return $this->respondSuccess(new PermissionResource($permission), 'Permission created successfully.', 201);
        } catch (InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Create a module with basic permissions (view, create, edit, delete).
     * api: POST /admin/api/user/permission/create-module
     */
    public function createModule(Request $request): JsonResponse
    {
        $validated = app(CreateModulePermissionsRequest::class)->validated();

        try {
            $permissions = $this->permissionService->createModulePermissions(
                $validated['module'],
                $validated['actions'],
                $validated['name'] ?? null,
                $validated['description'] ?? null
            );

            return $this->respondSuccess(
                PermissionResource::collection(collect($permissions)),
                'Module permissions created successfully.',
                201
            );
        } catch (InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Delete a permission by ID.
     * api: DELETE /admin/api/user/permission/{id}
     */
    public function destroy(int|string $id): JsonResponse
    {
        try {
            $this->permissionService->deletePermission((int) $id);
            return $this->respondSuccess(null, 'Permission deleted successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
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

    /**
     * Get list of unique module names.
     * api: GET /admin/api/user/permission/distinct-modules
     */
    public function distinctModules(): JsonResponse
    {
        $modules = $this->permissionService->getModules();
        return $this->respondSuccess($modules, 'Distinct modules retrieved successfully.');
    }
}
