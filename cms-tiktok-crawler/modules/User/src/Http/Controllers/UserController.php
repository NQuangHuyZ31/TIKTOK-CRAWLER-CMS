<?php

namespace Modules\User\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Models\User;
use Modules\User\Http\Requests\StoreUserRequest;
use Modules\User\Http\Requests\UpdateUserRequest;
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
        protected UserService $userService
    ) {}

    protected function resolveRequestUser(Request $request): ?User
    {
        return $request->user() ?? auth('sanctum')->user() ?? auth()->user();
    }

    /**
     * Retrieve details of a specific user account by ID.
     */
    public function show(int|string $id): JsonResponse
    {
        $user = $this->userService->getUserById((int) $id, $this->withRelations);
        if (!$user) {
            return $this->respondError('User account not found.', 404);
        }

        return $this->respondSuccess(new UserResource($user), 'User retrieved successfully.');
    }

    /**
     * Create a new user account with roles and optional direct permissions.
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
     */
    public function statisticsSummary(?Request $request = null): JsonResponse
    {
        $stats = $this->userService->getStatisticsSummary();
        return $this->respondSuccess($stats, 'User statistics retrieved successfully.');
    }

    /**
     * Retrieve all system roles and permissions catalog for assignment UI.
     */
    public function rolesAndPermissions(?Request $request = null): JsonResponse
    {
        $data = $this->userService->getRolesAndPermissionsCatalog();
        return $this->respondSuccess($data, 'Roles and permissions retrieved successfully.');
    }

    /**
     * Send reset password email to the user.
     */
    public function resetPassword(int|string $id): JsonResponse
    {
        try {
            $this->userService->sendMailResetPassword($id);
            return $this->respondSuccess(null, 'Reset password email sent successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Reset two-factor authentication secret for a user.
     */
    public function resetAuthentication(Request $request): JsonResponse
    {
        $email = $request->input('email');
        if (empty($email)) {
            return $this->respondError('The email field is required.', 422);
        }

        $currentUser = $this->resolveRequestUser($request);
        if (!$currentUser) {
            return $this->respondError('Unauthenticated.', 401);
        }

        try {
            $user = $this->userService->resetAuthentication($email, $currentUser);
            return $this->respondSuccess($user ? new UserResource($user) : null, 'Reset authentication successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }
}
