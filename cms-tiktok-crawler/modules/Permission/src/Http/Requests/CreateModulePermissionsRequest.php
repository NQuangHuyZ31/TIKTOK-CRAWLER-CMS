<?php

namespace Modules\Permission\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateModulePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module'      => ['required', 'string', 'max:100'],
            'name'        => ['nullable', 'string', 'max:255'],
            'actions'     => ['required', 'array', 'min:1'],
            'actions.*'   => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
