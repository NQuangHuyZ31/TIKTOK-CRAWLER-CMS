<?php

namespace Modules\System\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSystemSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'group' => 'nullable|string|max:50',
            'settings' => 'required|array',
            'settings.auto_cleanup_enabled' => 'nullable|boolean',
            'settings.cleanup_schedule_preset' => 'nullable|string|in:daily_02_00,daily_00_00,weekly_sun,custom',
            'settings.cleanup_schedule_cron' => 'nullable|string|max:50',
            'settings.activity_log_retention_days' => 'nullable|integer|min:7',
            'settings.login_log_retention_days' => 'nullable|integer|min:14',
            'settings.cleanup_chunk_size' => 'nullable|integer|min:50|max:5000',
            'settings.cleanup_sleep_between_batches_ms' => 'nullable|integer|min:0|max:2000',
        ];
    }
}
