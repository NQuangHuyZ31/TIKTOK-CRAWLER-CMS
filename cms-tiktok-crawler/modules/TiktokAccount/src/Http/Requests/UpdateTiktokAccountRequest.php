<?php

namespace Modules\TiktokAccount\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTiktokAccountRequest extends FormRequest
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
        $id = $this->route('id') ?? $this->id;
        if (is_numeric($id)) {
            $id = (int) $id;
        }

        return [
            'username' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('tiktok_accounts', 'username')->ignore($id),
            ],
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

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'TikTok username is required.',
            'username.unique' => 'This TikTok username is already taken.',
        ];
    }
}
