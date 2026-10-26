<?php

namespace Modules\User\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Modules\Core\Controllers\BaseController;
use Modules\User\Models\User;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;
use Modules\User\Requests\StoreUserRequest;
use Modules\User\Requests\UpdateUserRequest;
use Modules\User\Resources\UserResource;
use Modules\User\Services\UserService;

class UserController extends BaseController
{
    public string $permissionModule = 'user';

    protected string $modelClass = User::class;
    protected ?string $resourceClass = UserResource::class;
    protected array $searchableColumns = ['name', 'email', 'phone'];
    protected array $filterableColumns = ['status', 'roles'];
    protected array $filterRelationMap = ['role' => 'roles.slug'];
    protected array $defaultSort = ['id', 'desc'];
    protected array $withRelations = ['roles.permissions', 'permissions'];

    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected UserService $userService
    ) {}

    protected function resolveRequestUser(Request $request): \App\Models\User|User|null
    {
        return $request->user() ?? auth('sanctum')->user() ?? auth()->user();
    }

    /**
     * Retrieve details of a specific user account by ID.
     * Includes assigned roles, direct permissions, and module permissions matrix.
     * api: GET /{module}/user/users/{id}
     */
    public function show(int|string $id): JsonResponse
    {
        $user = $this->userRepository->findById((int) $id, $this->withRelations);
        if (!$user) {
            return $this->respondError('User account not found.', 404);
        }

        return $this->respondSuccess(new UserResource($user), 'User retrieved successfully.');
    }

    /**
     * Create a new user account with roles and optional direct permissions.
     * api: POST /{module}/user/users
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(StoreUserRequest::class)->validated();

        try {
            $user = $this->userService->createUser($validated);
            return $this->respondSuccess(new UserResource($user), 'User account created successfully.', 201);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Update an existing user account, roles, and direct permissions.
     * api: PUT /{module}/user/users/{id}
     * api: PATCH /{module}/user/users/{id}
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $currentUser = $this->resolveRequestUser($request);
        $validated = app(UpdateUserRequest::class)->validated();

        try {
            $user = $this->userService->updateUser((int) $id, $validated, $currentUser);
            return $this->respondSuccess(new UserResource($user), 'User account updated successfully.');
        } catch (InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Delete a user account (with protection against self-deletion and last admin deletion).
     * api: DELETE /{module}/user/users/{id}
     */
    public function destroy(int|string $id): JsonResponse
    {
        $currentUser = $this->resolveRequestUser(request());

        try {
            $this->userService->deleteUser((int) $id, $currentUser);
            return $this->respondSuccess(null, 'User account deleted successfully.');
        } catch (InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Quick status toggle (active, inactive, blocked).
     * api: PATCH /{module}/user/users/{id}/status
     * api: POST /{module}/user/users/{id}/status
     */
    public function updateStatus(Request $request, int|string $id): JsonResponse
    {
        $status = $request->input('status');
        if (empty($status)) {
            return $this->respondError('The status field is required.', 422);
        }

        $currentUser = $this->resolveRequestUser($request);

        try {
            $user = $this->userService->updateStatus((int) $id, $status, $currentUser);
            return $this->respondSuccess(new UserResource($user), 'User status updated successfully.');
        } catch (InvalidArgumentException $e) {
            return $this->respondError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Retrieve aggregate KPI dashboard statistics for user accounts.
     * api: GET /{module}/user/users/statistics-summary
     */
    public function statisticsSummary(Request $request = null)
    {
        $stats = $this->userRepository->getStatisticsSummary();
        return $this->respondSuccess($stats, 'User statistics retrieved successfully.');
    }

    /**
     * Retrieve all system roles and permissions catalog for assignment UI.
     * api: GET /{module}/user/users/roles-and-permissions
     */
    public function rolesAndPermissions(Request $request = null)
    {
        $data = $this->userService->getRolesAndPermissionsCatalog();
        return $this->respondSuccess($data, 'Roles and permissions retrieved successfully.');
    }
}
