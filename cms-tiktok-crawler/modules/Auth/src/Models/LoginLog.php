<?php

namespace Modules\Auth\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginLog extends Model
{
    use HasFactory;

    protected $table = 'login_logs';

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'device',
        'status',
        'failure_reason',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * User associated with the login log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
