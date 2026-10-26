<?php

namespace Modules\TiktokAccount\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTiktokAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => 'required|string|max:255|unique:tiktok_accounts,username',
            'nickname' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'profile_url' => 'nullable|url|max:255',
            'followers_count' => 'nullable|integer|min:0',
            'following_count' => 'nullable|integer|min:0',
            'likes_count' => 'nullable|integer|min:0',
            'video_count' => 'nullable|integer|min:0',
            'is_verified' => 'nullable|boolean',
            'status' => 'sometimes|in:active,inactive,banned',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ];
    }
}
