<?php

namespace Modules\System\Services;

use Modules\System\Models\LoginLog;
use Modules\System\Repositories\Interfaces\LoginLogRepositoryInterface;

class LoginLogService
{
    public function __construct(
        protected LoginLogRepositoryInterface $loginLogRepository
    ) {}

    /**
     * Record a new login attempt log via repository.
     */
    public function record(array $data): LoginLog
    {
        return $this->loginLogRepository->create([
            'user_id' => $data['user_id'] ?? null,
            'email' => $data['email'] ?? '',
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'device' => $data['device'] ?? null,
            'status' => $data['status'] ?? 'success',
            'failure_reason' => $data['failure_reason'] ?? null,
        ]);
    }
}
