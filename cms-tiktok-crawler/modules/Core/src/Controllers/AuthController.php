<?php

namespace Modules\Core\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Modules\Core\Models\Permission;
use Modules\Core\Traits\ApiResponseTrait;

/**
 * Class AuthController
 *
 * Handles CMS authentication, session token issuing, current user inspection,
 * permission catalog inspection, and token revocation.
 */
class AuthController
{
    use ApiResponseTrait;

    /**
     * Authenticate user credentials and return Sanctum Bearer token and permission matrix.
     * API: POST /{admin_path}/api/core/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->respondError('Invalid credentials.', 401);
        }

        if ($user->status !== 'active') {
            return $this->respondError('Your account has been deactivated.', 403);
        }

        $token = $user->createToken('cms_token')->plainTextToken;

        return $this->respondSuccess([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status,
                'avatar' => $user->avatar,
                'roles' => $user->roles()->pluck('slug')->values(),
                'permissions' => $user->allPermissions()->pluck('slug')->values(),
                'module_permissions' => $user->getModulePermissions(),
            ],
        ], 'Login successful.');
    }

    /**
     * Get currently authenticated user profile and module permission matrix.
     * API: GET /{admin_path}/api/core/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->resolveAuthenticatedUser($request);

        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        return $this->respondSuccess([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'avatar' => $user->avatar,
            'roles' => $user->roles()->pluck('slug')->values(),
            'permissions' => $user->allPermissions()->pluck('slug')->values(),
            'module_permissions' => $user->getModulePermissions(),
        ], 'User profile retrieved successfully.');
    }

    /**
     * Get the global catalog of system permissions grouped by module.
     * API: GET /{admin_path}/api/core/auth/permissions
     */
    public function permissions(Request $request): JsonResponse
    {
        $grouped = Permission::all()->groupBy('module')->map(function ($items) {
            return $items->values();
        });

        // Ensure canonical modules exist in the catalog
        $modules = ['crawler', 'tiktok_account', 'core', 'user'];
        foreach ($modules as $mod) {
            if (!$grouped->has($mod)) {
                $grouped->put($mod, collect([]));
            }
        }

        return $this->respondSuccess($grouped, 'Permissions catalog retrieved successfully.');
    }

    /**
     * Revoke current Sanctum access token and log out the user.
     * API: POST /{admin_path}/api/core/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        if ($bearer = $request->bearerToken()) {
            $tokenModel = PersonalAccessToken::findToken($bearer);
            if ($tokenModel) {
                $tokenModel->delete();
            }
        } elseif ($user = $request->user('sanctum') ?? $request->user()) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
        }

        return $this->respondSuccess(null, 'Logged out successfully.');
    }

    /**
     * Resolve user from Sanctum guard or bearer token.
     */
    protected function resolveAuthenticatedUser(Request $request): ?User
    {
        $user = $request->user('sanctum') ?? $request->user();

        if (!$user && ($bearer = $request->bearerToken())) {
            $tokenModel = PersonalAccessToken::findToken($bearer);
            if ($tokenModel && $tokenModel->tokenable instanceof User) {
                $user = $tokenModel->tokenable;
                $user->withAccessToken($tokenModel);
            }
        }

        return $user;
    }
}
