<?php

namespace Modules\ModuleManager\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateModuleVisibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hidden_modules'   => ['nullable', 'array'],
            'hidden_modules.*' => ['string', 'max:50'],
        ];
    }
}
