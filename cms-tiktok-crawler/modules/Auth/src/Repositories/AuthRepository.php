<?php

namespace Modules\Auth\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Auth\Models\LoginLog;
use Modules\Auth\Repositories\Interfaces\AuthRepositoryInterface;
use Modules\Core\Repositories\BaseRepository;

class AuthRepository extends BaseRepository implements AuthRepositoryInterface
{
    protected function getModel(): Model {
        return new User();
    }

    /**
     * Record a login attempt log.
     */
    public function recordLoginLog(array $data): LoginLog
    {
        return LoginLog::create([
            'user_id' => $data['user_id'] ?? null,
            'email' => $data['email'] ?? '',
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'device' => $data['device'] ?? null,
            'status' => $data['status'] ?? 'success',
            'failure_reason' => $data['failure_reason'] ?? null,
        ]);
    }

    /**
     * Retrieve paginated login logs with optional filtering.
     */
    public function getLoginLogs(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = LoginLog::with('user:id,name,email')
            ->orderBy('id', 'desc');

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['email'])) {
            $query->where('email', 'like', '%' . $filters['email'] . '%');
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['ip_address'])) {
            $query->where('ip_address', 'like', '%' . $filters['ip_address'] . '%');
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('device', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }
}

