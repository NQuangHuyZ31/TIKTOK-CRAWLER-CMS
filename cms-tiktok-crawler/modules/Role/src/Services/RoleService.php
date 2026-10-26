<?php

namespace Modules\Role\Services;

use Illuminate\Support\Str;
use Modules\Permission\Repositories\PermissionRepositoryInterface;
use Modules\Role\Models\Role;
use Modules\Role\Repositories\RoleRepositoryInterface;

class RoleService
{
    public function __construct(
        protected RoleRepositoryInterface $roleRepository,
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    /**
     * Create a new role and optionally sync permissions.
     */
    public function createRole(array $data): Role
    {
        $slug = !empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['name']);
        
        // Ensure slug uniqueness
        $baseSlug = $slug;
        $counter = 1;
        while ($this->roleRepository->findBySlug($slug)) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $role = $this->roleRepository->create([
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
        ]);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $this->syncRolePermissions($role, $data['permissions']);
        }

        return $role->load('permissions');
    }

    /**
     * Update an existing role and sync permissions.
     */
    public function updateRole(int|string $id, array $data): Role
    {
        $role = $this->roleRepository->findOrFail($id);

        $updateData = ['name' => $data['name']];

        // Do not allow changing the slug of the primary administrator role
        if ($role->slug !== 'admin' && !empty($data['slug'])) {
            $slug = Str::slug($data['slug']);
            $existing = $this->roleRepository->findBySlug($slug);
            if (!$existing || $existing->id === $role->id) {
                $updateData['slug'] = $slug;
            }
        }

        if (isset($data['description'])) {
            $updateData['description'] = $data['description'];
        }

        $this->roleRepository->update($role->id, $updateData);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $this->syncRolePermissions($role, $data['permissions']);
        }

        return $role->refresh()->load('permissions');
    }

    /**
     * Delete role with safeguard preventing deletion of the admin role.
     */
    public function deleteRole(int|string $id): bool
    {
        $role = $this->roleRepository->findOrFail($id);

        if ($role->slug === 'admin') {
            throw new \InvalidArgumentException('The super administrator role cannot be deleted.');
        }

        return $this->roleRepository->delete($id);
    }

    /**
     * Get single role with eager-loaded permissions.
     */
    public function getRoleWithPermissions(int|string $id): ?Role
    {
        return $this->roleRepository->findWithPermissions($id);
    }

    /**
     * Synchronize permissions into role via injected PermissionRepository.
     *
     * @param Role $role
     * @param array<int|string> $permissions
     */
    public function syncRolePermissions(Role $role, array $permissions): array
    {
        $ids = [];
        $slugs = [];

        foreach ($permissions as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } else {
                $slugs[] = (string) $item;
            }
        }

        if (!empty($slugs)) {
            $resolvedIds = $this->permissionRepository->resolveIdsBySlugs($slugs);
            $ids = array_unique(array_merge($ids, $resolvedIds));
        }

        return $this->roleRepository->syncPermissions($role, $ids);
    }
}
