<?php

namespace Modules\ModuleManager\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScaffoldModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module'           => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_-]+$/'],
            'name'             => ['nullable', 'string', 'max:255'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'route_path'       => ['nullable', 'string', 'max:120'],
            'icon'             => ['nullable', 'string', 'max:50'],
            'order'            => ['nullable', 'integer', 'min:0', 'max:9999'],
            'menu_placement'   => ['nullable', 'string', 'in:top,submenu'],
            'parent_path'      => ['required_if:menu_placement,submenu', 'nullable', 'string', 'max:120'],
            'create_permissions' => ['nullable', 'boolean'],
            'permissions'      => ['nullable', 'array'],
            'permissions.*'    => ['string', 'max:50'],
            'submenus'         => ['nullable', 'array'],
            'submenus.*.label' => ['required_with:submenus', 'string', 'max:100'],
            'submenus.*.path'  => ['required_with:submenus', 'string', 'max:120'],
            'submenus.*.icon'  => ['nullable', 'string', 'max:50'],
        ];
    }
}
