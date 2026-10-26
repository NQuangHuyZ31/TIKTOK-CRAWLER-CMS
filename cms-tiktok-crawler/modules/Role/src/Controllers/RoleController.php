<?php

namespace Modules\Role\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Controllers\BaseController;
use Modules\Permission\Services\PermissionService;
use Modules\Role\Models\Role;
use Modules\Role\Requests\RoleRequest;
use Modules\Role\Resources\RoleResource;
use Modules\Role\Services\RoleService;

class RoleController extends BaseController
{
    protected string $modelClass = Role::class;
    protected string $resourceClass = RoleResource::class;
    protected array $searchableColumns = ['name', 'slug', 'description'];
    protected array $withRelations = ['permissions'];

    public function __construct(
        protected RoleService $roleService,
        protected PermissionService $permissionService
    ) {}

    /**
     * Get list of roles with pagination and keyword search.
     * api: /admin/api/role/role
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request)
    {
        return parent::index($request);
    }

    /**
     * Get details of a single role with its assigned permissions.
     * api: /admin/api/role/role/{id}
     *
     * @param int|string $id
     * @return JsonResponse
     */
    public function show($id)
    {
        $role = $this->roleService->getRoleWithPermissions($id);
        if (!$role) {
            return $this->respondError('Role not found.', 404);
        }

        return $this->respondSuccess(new RoleResource($role), 'Role details retrieved successfully.');
    }

    /**
     * Create a new role with optional permission assignments.
     * api: /admin/api/role/role
     *
     * @param RoleRequest $request
     * @return JsonResponse
     */
    public function store(RoleRequest $request): JsonResponse
    {
        try {
            $role = $this->roleService->createRole($request->validated());
            return $this->respondSuccess(new RoleResource($role), 'Role created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Update an existing role and its permissions.
     * api: /admin/api/role/role/{id}
     *
     * @param int|string $id
     * @param RoleRequest $request
     * @return JsonResponse
     */
    public function update($id, RoleRequest $request): JsonResponse
    {
        try {
            $role = $this->roleService->updateRole($id, $request->validated());
            return $this->respondSuccess(new RoleResource($role), 'Role updated successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Delete an existing role with protection for system administrator.
     * api: /admin/api/role/role/{id}
     *
     * @param int|string $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        try {
            $this->roleService->deleteRole($id);
            return $this->respondSuccess(null, 'Role deleted successfully.');
        } catch (\InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 403);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Get all available permissions grouped by module via injected PermissionService.
     * api: /admin/api/role/role/permissions
     *
     * @return JsonResponse
     */
    public function permissions(): JsonResponse
    {
        $grouped = $this->permissionService->getGroupedPermissions();
        return $this->respondSuccess($grouped, 'Available permissions retrieved successfully.');
    }
}
