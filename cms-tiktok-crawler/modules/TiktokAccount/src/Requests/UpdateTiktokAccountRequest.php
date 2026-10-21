<?php

namespace Modules\TiktokAccount\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
        return [
            "username" => "required|string|max:255",
			"followers_count" => "required|integer|min:0",
            "following_count" => "required|integer|min:0",
			"likes_count" => "required|integer|min:0",
			"profile_url" => "required|url|max:255|regex:/^https:\/\/www\.tiktok\.com\/@[\w.-]+$/",
			"avatar" => "sometimes|image|mimes:jpeg,png,jpg,gif|max:2048",
			"status" => "required|in:active,inactive",
        ];
    }
}
