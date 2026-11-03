<?php

namespace Modules\Auth\Http\Controllers;

use Modules\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Http\Requests\GoogleLoginRequest;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Http\Requests\ResetPasswordRequest;
use Modules\Auth\Http\Requests\Verify2FARequest;
use Modules\Auth\Services\AuthService;
use Modules\Core\Http\Controllers\BaseController;

class AuthController extends BaseController
{
    public array $publicActions = [
        'login',
        'verify2fa',
        'googleLogin',
        'config2fa',
        'forgotPassword',
        'resetPassword',
    ];

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
     * Authenticate user with credentials and issue Bearer token (or require 2FA).
     * api: POST /{admin_path}/api/auth/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $data = $this->authService->login($request->validated(), $request->ip(), $request->userAgent());

            $message = !empty($data['require_2fa'])
                ? 'Two-factor authentication required.'
                : 'Login successful.';

            return $this->respondSuccess($data, $message);
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first() ?: 'Invalid email or password.';
            return $this->respondError($message, 401, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Verify 6-digit TOTP code and finalize authentication.
     * api: POST /{admin_path}/api/auth/auth/verify-2fa
     */
    public function verify2fa(Verify2FARequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $data = $this->authService->verify2fa($validated['temp_token'], $validated['code']);

            return $this->respondSuccess($data, 'Two-factor authentication verified successfully.');
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first() ?: 'Invalid 2FA verification code.';
            return $this->respondError($message, 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Authenticate with Google credential / OAuth payload.
     * api: POST /{admin_path}/api/auth/auth/google-login
     */
    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        try {
            $data = $this->authService->loginWithGoogle($request->validated(), $request->ip(), $request->userAgent());

            $message = !empty($data['require_2fa'])
                ? 'Two-factor authentication required.'
                : 'Google sign-in successful.';

            return $this->respondSuccess($data, $message);
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first() ?: 'Google authentication failed.';
            return $this->respondError($message, 401, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Retrieve global 2FA configuration status.
     * api: GET /{admin_path}/api/auth/auth/config-2fa
     */
    public function config2fa(): JsonResponse
    {
        return $this->respondSuccess($this->authService->get2faConfig(), '2FA configuration retrieved.');
    }

    /**
     * Terminate the user's active session and revoke the current access token.
     * api: POST /{admin_path}/api/auth/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        $this->authService->logout($user);

        return $this->respondSuccess(null, 'Logged out successfully.');
    }

    /**
     * Get the authenticated user's profile and module permissions matrix.
     * api: GET /{admin_path}/api/auth/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        return $this->respondSuccess(
            $this->authService->getMe($user),
            'Profile retrieved successfully.'
        );
    }

    /**
     * Initiate forgot password flow by issuing a password reset token.
     * api: POST /{admin_path}/api/auth/auth/forgot-password
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        try {
            $token = $this->authService->forgotPassword($request->input('email'));

            return $this->respondSuccess(['token' => $token], 'Password reset token generated successfully.');
        } catch (ValidationException $e) {
            return $this->respondError($e->getMessage(), 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Change user password with current password verification.
     * api: POST /{admin_path}/api/auth/auth/change-password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        try {
            $this->authService->changePassword($user, $request->only('current_password', 'password'));

            return $this->respondSuccess(null, 'Password changed successfully.');
        } catch (ValidationException $e) {
            return $this->respondError($e->getMessage(), 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Update profile details for the authenticated user.
     * api: PUT /{admin_path}/api/auth/auth/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string',
        ]);

        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return $this->respondError('Unauthenticated.', 401);
        }

        try {
            $data = $this->authService->updateProfile($user, $request->only('name', 'phone', 'avatar'));

            return $this->respondSuccess($data, 'Profile updated successfully.');
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * Reset account password using the reset token.
     * api: POST /{admin_path}/api/auth/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $this->authService->resetPassword($request->validated());

            return $this->respondSuccess(null, 'Password has been reset successfully.');
        } catch (ValidationException $e) {
            return $this->respondError($e->getMessage(), 422, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }
}
