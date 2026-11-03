<?php

namespace Modules\Auth\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Modules\Auth\Http\Requests\LoginRequest;
use Modules\Auth\Http\Requests\ResetPasswordRequest;
use Modules\Auth\Http\Requests\Verify2FARequest;
use Modules\Auth\Http\Requests\VerifyAuthCodeRequest;
use Modules\Auth\Services\AuthService;
use Modules\Core\Http\Controllers\BaseController;
use Modules\User\Models\User;

class AuthController extends BaseController
{
    public array $publicActions = [
        'login',
        'verifyCode',
        'verify2fa',
        'verifyEmailOtp',
        'resendEmailOtp',
        'challenge2fa',
        'googleRedirect',
        'googleCallback',
        'forgotPassword',
        'resetPassword',
    ];

    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Standard email + password login (issues Bearer token or requires challenge).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        return $this->executeAuthAction(function () use ($request) {
            $data = $this->authService->login($request->validated(), $request->ip(), $request->userAgent());
            $message = !empty($data['require_2fa'])
                ? 'Two-factor authentication required.'
                : (!empty($data['require_otp']) ? 'Email verification code sent.' : 'Login successful.');
            return $this->respondSuccess($data, $message);
        }, 401);
    }

    /**
     * Unified challenge code verification (Email OTP or Google 2FA).
     */
    public function verifyCode(VerifyAuthCodeRequest $request): JsonResponse
    {
        return $this->executeAuthAction(function () use ($request) {
            $data = $this->authService->verifyCode($request->validated('temp_token'), $request->validated('code'));
            return $this->respondSuccess($data, 'Verification successful.');
        });
    }

    /**
     * Verify 6-digit TOTP code and issue Sanctum token (backward-compatible).
     */
    public function verify2fa(VerifyAuthCodeRequest $request): JsonResponse
    {
        return $this->verifyCode($request);
    }

    /**
     * Verify email 6-digit OTP code and issue Sanctum token (backward-compatible).
     */
    public function verifyEmailOtp(VerifyAuthCodeRequest $request): JsonResponse
    {
        return $this->verifyCode($request);
    }

    /**
     * Resend fresh OTP code to user's email.
     */
    public function resendEmailOtp(Request $request): JsonResponse
    {
        $request->validate([
            'temp_token' => 'required|string',
        ]);

        return $this->executeAuthAction(function () use ($request) {
            $data = $this->authService->resendEmailOtp($request->input('temp_token'));
            return $this->respondSuccess($data, 'A new verification code has been sent.');
        });
    }

    /**
     * Fetch active 2FA challenge details (QR code and secret) by temp_token.
     */
    public function challenge2fa(Request $request): JsonResponse
    {
        $tempToken = (string) $request->query('temp_token', '');
        if ($tempToken === '') {
            return $this->respondError('Temporary token is required.', 422);
        }

        $challenge = $this->authService->get2FAChallenge($tempToken);
        return $challenge
            ? $this->respondSuccess($challenge, '2FA challenge retrieved successfully.')
            : $this->respondError('The 2FA verification session has expired or is invalid.', 404);
    }

    /**
     * Redirect to Google OAuth authorization consent screen via Socialite.
     */
    public function googleRedirect(): mixed
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle OAuth callback from Google via Socialite.
     */
    public function googleCallback(Request $request): mixed
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/') ?: 'admin';
        $loginUrl = "/{$adminPath}/auth/login";

        if ($request->has('error') || !$request->has('code')) {
            $error = $request->input('error_description') ?: $request->input('error', 'Google authentication was cancelled.');
            return redirect($loginUrl . '?error=' . urlencode($error));
        }

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            $data = $this->authService->loginWithGoogle([
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ], $request->ip(), $request->userAgent());

            if (!empty($data['require_2fa'])) {
                return redirect($loginUrl . '?step=2fa&temp_token=' . urlencode($data['temp_token']));
            }

            return redirect($loginUrl . '?token=' . urlencode($data['token']));
        } catch (ValidationException $e) {
            $error = $e->validator->errors()->first() ?: 'This Google account is not registered in the system.';
            return redirect($loginUrl . '?error=' . urlencode($error));
        } catch (\Throwable $e) {
            return redirect($loginUrl . '?error=' . urlencode($e->getMessage()));
        }
    }

    /**
     * Get profile and module permissions for authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser($request);
        return $user
            ? $this->respondSuccess($this->authService->getMe($user), 'Profile retrieved successfully.')
            : $this->respondError('Unauthenticated.', 401);
    }

    /**
     * Revoke access token and terminate active session.
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
     * Generate password reset token.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        return $this->executeAuthAction(fn () =>
            $this->respondSuccess(
                ['token' => $this->authService->forgotPassword($request->input('email'))],
                'Password reset token generated successfully.'
            )
        );
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        return $this->executeAuthAction(function () use ($request) {
            $this->authService->resetPassword($request->validated());
            return $this->respondSuccess(null, 'Password has been reset successfully.');
        });
    }

    /**
     * Resolve the currently authenticated user from request or Sanctum guard.
     */
    protected function getAuthenticatedUser(Request $request): ?User
    {
        return $request->user() ?? auth('sanctum')->user();
    }

    /**
     * Unified execution wrapper to centralize validation and error handling.
     */
    protected function executeAuthAction(callable $action, int $validationStatus = 422): JsonResponse
    {
        try {
            return $action();
        } catch (ValidationException $e) {
            $message = $e->validator->errors()->first() ?: $e->getMessage();
            return $this->respondError($message, $validationStatus, $e->errors());
        } catch (\Throwable $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }
}
