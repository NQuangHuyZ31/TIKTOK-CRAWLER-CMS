<?php

namespace Modules\System\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\System\Traits\LogsActivity;

class SystemSetting extends Model
{
    use HasFactory, LogsActivity;

    public string $activityModule = 'SYSTEM';
    public string $activityRecordType = 'SystemSetting';

    protected $table = 'system_settings';

    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'description',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    /**
     * Dynamically convert value according to the type definition.
     */
    public function getValueAttribute($value): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($this->type ?? 'string') {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'json' => !empty($value) ? json_decode($value, true) : [],
            default => $value,
        };
    }

    /**
     * Dynamically serialize value before storing.
     */
    public function setValueAttribute(mixed $value): void
    {
        if ($value === null) {
            $this->attributes['value'] = null;
            return;
        }

        if (is_bool($value)) {
            $this->attributes['value'] = $value ? '1' : '0';
        } elseif (is_array($value) || is_object($value)) {
            $this->attributes['value'] = json_encode($value, JSON_UNESCAPED_UNICODE);
        } else {
            $this->attributes['value'] = (string) $value;
        }
    }
}
