<?php

namespace Modules\Auth\Services;

use Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Modules\System\Facades\Audit;
use Modules\System\Services\LoginLogService;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepository,
        protected LoginLogService $loginLogService
    ) {}

    /**
     * Authenticate user with credentials and issue personal access token.
     */
    public function login(array $data, ?string $ipAddress = null, ?string $userAgent = null): array
    {
        $device = $this->detectDevice($userAgent);
        $user = $this->userRepository->findByEmail($data['email']);
        $logData = [
            'user_id' => $user?->id,
            'email' => $data['email'],
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device' => $device,
        ];

        $dummyHash = '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';
        $passwordValid = Hash::check($data['password'], $user ? $user->password : $dummyHash);

        if (!$user || !$passwordValid) {
            $this->logAndFail($logData, 'invalid_credentials', ['email' => ['The provided credentials do not match our records.']]);
        }

        if ($user->status === 'blocked') {
            $this->logAndFail($logData, 'account_blocked', ['email' => ['This account has been blocked. Please contact support.']]);
        }

        if ($user->status === 'inactive') {
            $this->logAndFail($logData, 'account_inactive', ['email' => ['This account is inactive.']]);
        }

        // Issue Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Record successful login log via System LoginLogService
        $logData['status'] = 'success';
        $logData['failure_reason'] = null;
        $this->loginLogService->record($logData);

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->formatUserData($user),
        ];
    }

    /**
     * Terminate the user's active session and revoke access tokens.
     */
    public function logout(User $user): void
    {
        $currentToken = $user->currentAccessToken();
        if ($currentToken) {
            $currentToken->delete();
        } else {
            $user->tokens()->delete();
        }
    }

    /**
     * Parse client device category from User-Agent.
     */
    protected function detectDevice(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown';
        }

        if (preg_match('/(tablet|ipad|playbook)|(android(?!.*(mobi|opera mini)))/i', $userAgent)) {
            return 'Tablet';
        }

        if (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile|iphone)/i', $userAgent)) {
            return 'Mobile';
        }

        return 'Desktop';
    }

    /**
     * Format current user payload with roles and module permissions matrix.
     */
    public function getMe(User $user): array
    {
        return $this->formatUserData($user);
    }

    /**
     * Generate password reset token for forgot password request.
     */
    public function forgotPassword(string $email): string
    {
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => [__('passwords.user')],
            ]);
        }

        $token = Password::createToken($user);

        Audit::record(
            action: 'REQUEST_RESET_PASSWORD',
            target: $user,
            metadata: ['email' => $email, 'method' => 'forgot_password'],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );

        return $token;
    }

    /**
     * Change password for the authenticated user.
     */
    public function changePassword(User $user, array $data): void
    {
        if (!Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match our records.'],
            ]);
        }

        $this->userRepository->update($user->id, [
            'password' => Hash::make($data['password']),
        ]);

        Audit::record(
            action: 'CHANGE_PASSWORD',
            target: $user,
            metadata: ['email' => $user->email],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );
    }

    /**
     * Update profile details for the authenticated user.
     */
    public function updateProfile(User $user, array $data): array
    {
        $allowed = ['name', 'phone', 'avatar'];
        $updateData = array_intersect_key($data, array_flip($allowed));

        if (!empty($updateData)) {
            $this->userRepository->update($user->id, $updateData);
            $user->refresh();
        }

        Audit::record(
            action: 'UPDATE_PROFILE',
            target: $user,
            metadata: $updateData,
            status: 'SUCCESS',
            module: 'AUTH',
            user: $user
        );

        return $this->formatUserData($user);
    }

    /**
     * Reset account password using the provided credentials.
     *
     * @param array<string, mixed> $credentials
     */
    public function resetPassword(array $credentials): void
    {
        /** @var User|null $resetUser */
        $resetUser = null;

        $status = Password::reset(
            $credentials,
            function (User $user, string $password) use (&$resetUser) {
                $resetUser = $user;
                $this->userRepository->update($user->id, [
                    'password' => Hash::make($password),
                ]);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            Audit::record(
                action: 'RESET_PASSWORD',
                target: $credentials['email'] ?? null,
                metadata: [
                    'email' => $credentials['email'] ?? null,
                    'reason' => 'invalid_or_expired_token',
                ],
                status: 'FAILED',
                errorMessage: __($status),
                module: 'AUTH',
                recordType: 'User'
            );

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        Audit::record(
            action: 'RESET_PASSWORD',
            target: $resetUser,
            metadata: [
                'email' => $resetUser?->email ?? $credentials['email'],
                'method' => 'token_reset',
            ],
            status: 'SUCCESS',
            module: 'AUTH',
            user: $resetUser
        );
    }
    
    /**
     * Format user data with roles, permissions, and module access matrix.
     */
    protected function formatUserData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'status' => $user->status,
            'is_admin' => $user->isAdmin(),
            'roles' => $user->getRolesSlugs(),
            'permissions' => $user->getAllPermissionsSlugs(),
            'module_permissions' => $user->getModulePermissionsMatrix(),
        ];
    }

    private function logAndFail(array $logData, string $reason, array $messages): never
    {
        $logData['status'] = 'failed';
        $logData['failure_reason'] = $reason;
        $this->loginLogService->record($logData);

        throw ValidationException::withMessages($messages);
    }
}
