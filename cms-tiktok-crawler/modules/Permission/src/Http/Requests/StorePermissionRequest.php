<?php

namespace Modules\Permission\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module'      => ['required', 'string', 'max:100'],
            'action'      => ['required', 'string', 'max:100'],
            'name'        => ['nullable', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:permissions,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
