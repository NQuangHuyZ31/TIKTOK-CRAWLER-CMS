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
     * Create or update password reset token in password_reset_tokens table.
     */
    public function createPasswordResetToken(string $email): string
    {
        $token = Str::random(60);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => $token,
                'created_at' => Carbon::now(),
            ]
        );

        return $token;
    }

    /**
     * Verify if password reset token is valid and not expired (default: 60 mins).
     */
    public function verifyPasswordResetToken(string $email, string $token): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$record) {
            return false;
        }

        $createdAt = Carbon::parse($record->created_at);
        $expiresAt = $createdAt->addMinutes(config('auth.passwords.users.expire', 60));

        return Carbon::now()->lessThanOrEqualTo($expiresAt);
    }

    /**
     * Delete password reset token.
     */
    public function deletePasswordResetToken(string $email): void
    {
        DB::table('password_reset_tokens')->where('email', $email)->delete();
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

