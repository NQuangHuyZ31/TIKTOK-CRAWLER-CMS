<?php

namespace Modules\User\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $avatarUrl = null;
        if (!empty($this->avatar)) {
            $avatarUrl = filter_var($this->avatar, FILTER_VALIDATE_URL)
                ? $this->avatar
                : asset('storage/' . ltrim($this->avatar, '/'));
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'avatar_url' => $avatarUrl,
            'status' => $this->status ?? 'active',
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'is_admin' => (bool) ($this->is_admin ?? false) || $this->hasRole('admin'),
            'permission_type' => $this->getPermissionType(),
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                    'description' => $r->description,
                ]);
            }, function () {
                return $this->roles->map(fn($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'slug' => $r->slug,
                    'description' => $r->description,
                ]);
            }),
            'role_slugs' => $this->getRolesSlugs(),
            'permissions' => $this->whenLoaded('permissions', function () {
                return $this->permissions->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'module' => $p->module,
                    'action' => $p->action,
                ]);
            }, function () {
                return $this->permissions->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'module' => $p->module,
                    'action' => $p->action,
                ]);
            }),
            'all_permissions' => $this->getAllPermissionsSlugs(),
            'permissions_matrix' => $this->getModulePermissionsMatrix(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
