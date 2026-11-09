<?php

namespace Modules\Role\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Permission\Services\PermissionService;
use Modules\Role\Models\Role;
use Modules\Role\Http\Requests\RoleRequest;
use Modules\Role\Resources\RoleResource;
use Modules\Role\Services\RoleService;

class RoleController extends BaseController
{
    public string $permissionModule = 'role';

    protected string $modelClass = Role::class;
    protected ?string $resourceClass = RoleResource::class;
    protected array $searchableColumns = ['name', 'slug', 'description'];
    protected array $withRelations = ['permissions'];

    public function __construct(
        protected RoleService $roleService,
        protected PermissionService $permissionService
    ) {}

    /**
     * Get details of a single role with its assigned permissions.
     */
    public function show(int|string $id): JsonResponse
    {
        $role = $this->roleService->getRoleWithPermissions($id);
        if (!$role) {
            return $this->respondError('Role not found.', 404);
        }

        return $this->respondSuccess(new RoleResource($role), 'Role details retrieved successfully.');
    }

    /**
     * Create a new role with optional permission assignments.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(RoleRequest::class)->validated();

        try {
            $role = $this->roleService->createRole($validated);
            return $this->respondSuccess(new RoleResource($role), 'Role created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Update an existing role and its permissions.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $validated = app(RoleRequest::class)->validated();

        try {
            $role = $this->roleService->updateRole($id, $validated);
            return $this->respondSuccess(new RoleResource($role), 'Role updated successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Delete an existing role with protection for system administrator.
     */
    public function destroy(int|string $id): JsonResponse
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
     * Get all available permissions grouped by module.
     */
    public function permissions(): JsonResponse
    {
        $grouped = $this->permissionService->getGroupedPermissions();
        return $this->respondSuccess($grouped, 'Role permissions matrix retrieved successfully.');
    }
}
