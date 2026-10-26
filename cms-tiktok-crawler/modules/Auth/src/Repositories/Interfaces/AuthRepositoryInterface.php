<?php

namespace Modules\Auth\Repositories\Interfaces;

use App\Models\User;

interface AuthRepositoryInterface
{
    /**
     * Record a login attempt log.
     *
     * @param array<string, mixed> $data
     */
    public function recordLoginLog(array $data): \Modules\Auth\Models\LoginLog;

    /**
     * Retrieve paginated login logs with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function getLoginLogs(array $filters = [], int $perPage = 15): \Illuminate\Contracts\Pagination\LengthAwarePaginator;
}

