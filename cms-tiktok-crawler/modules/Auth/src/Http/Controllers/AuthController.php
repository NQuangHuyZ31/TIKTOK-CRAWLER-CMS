<?php

namespace Modules\Auth\Http\Controllers;

use Modules\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Http\Requests\ResetPasswordRequest;
use Modules\Auth\Services\AuthService;
use Modules\Core\Http\Controllers\BaseController;

class AuthController extends BaseController
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Resolve the currently authenticated user either from request or Sanctum guard.
     */
    protected function getAuthenticatedUser(Request $request): ?User
    {
        return $request->user() ?? auth('sanctum')->user();
    }

    /**
     * Authenticate user with credentials and issue Bearer token.
     * api: POST /{admin_path}/api/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $data = $this->authService->login($request->validated(), $request->ip(), $request->userAgent());

            return $this->respondSuccess($data, 'Login successful.');
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first() ?: 'Invalid email or password.';
            return $this->respondError($message, 401, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Terminate the user's active session and revoke the current access token.
     * api: POST /{admin_path}/api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        $currentToken = $user->currentAccessToken();
        if ($currentToken) {
            $currentToken->delete();
        } else {
            // Fallback: revoke all tokens for this user
            $user->tokens()->delete();
        }

        return $this->respondSuccess(null, 'Logged out successfully.');
    }

    /**
     * Get the authenticated user's profile and module permissions matrix.
     * api: GET /{admin_path}/api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        $data = $this->authService->getMe($user);
        return $this->respondSuccess($data, 'Profile retrieved successfully.');
    }

    /**
     * Reset account password using the provided reset token.
     * api: POST /{admin_path}/api/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $this->authService->resetPassword($request->validated());
            return $this->respondSuccess(null, 'Password has been reset successfully.');
        } catch (ValidationException $e) {
            return $this->respondError($e->validator->errors()->first(), 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }
}
