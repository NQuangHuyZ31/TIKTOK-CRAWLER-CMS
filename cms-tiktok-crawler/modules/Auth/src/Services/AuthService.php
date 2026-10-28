<?php

namespace Modules\Auth\Services;

use Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\System\Services\LoginLogService;
use Modules\User\Repositories\Interfaces\UserRepositoryInterface;

class AuthService
{
    public function __construct(
        protected AuthRepositoryInterface $authRepository,
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
     * Reset account password using the provided credentials.
     *
     * @param array<string, mixed> $credentials
     */
    public function resetPassword(array $credentials): void
    {
        $status = Password::reset(
            $credentials,
            function (User $user, string $password) {
                $this->userRepository->update($user->id, [
                    'password' => Hash::make($password),
                ]);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
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
