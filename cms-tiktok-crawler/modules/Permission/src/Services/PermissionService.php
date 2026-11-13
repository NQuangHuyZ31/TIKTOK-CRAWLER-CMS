<?php

namespace Modules\Permission\Services;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Modules\Permission\Models\Permission;
use Modules\Permission\Repositories\Interfaces\PermissionRepositoryInterface;

class PermissionService
{
    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    /**
     * Retrieve all permissions grouped by module.
     *
     * @return array<string, array<int, Permission>>
     */
    public function getGroupedPermissions(): array
    {
        return $this->permissionRepository->getGroupedByModule();
    }

    /**
     * Retrieve all permissions collection.
     *
     * @return Collection<int, Permission>
     */
    public function getAllPermissions(): Collection
    {
        return $this->permissionRepository->all();
    }

    /**
     * Retrieve unique module names.
     *
     * @param bool $ignore If true, filter out modules in config('modules.ignore_group')
     * @return array<string>
     */
    public function getModules(bool $ignore = false): array
    {
        $all = array_values(array_unique(array_merge(
            $this->permissionRepository->getDistinctModules(),
            config('modules.modules', [])
        )));

        return $ignore ? array_values(array_diff($all, config('modules.ignore_group', []))) : $all;
    }

    /**
     * Create a single permission.
     *
     * @param array<string, mixed> $data
     */
    public function createPermission(array $data): Permission
    {
        $module = Str::snake(trim($data['module']));
        $action = Str::snake(trim($data['action']));
        $slug = !empty($data['slug']) ? Str::slug($data['slug'], '.') : "{$module}.{$action}";

        $existing = $this->permissionRepository->findBySlug($slug);
        if ($existing) {
            throw new InvalidArgumentException("Permission with slug '{$slug}' already exists.");
        }

        $name = !empty($data['name']) ? trim($data['name']) : Str::headline($action) . ' ' . Str::headline($module);
        $description = !empty($data['description']) ? trim($data['description']) : "Can " . strtolower($action) . " " . Str::headline($module);

        return $this->permissionRepository->create([
            'module'      => $module,
            'action'      => $action,
            'slug'        => $slug,
            'name'        => $name,
            'description' => $description,
        ]);
    }

    /**
     * Create standard basic permissions for a module.
     *
     * @param array<int, string> $actions
     * @return array<int, Permission>
     */
    public function createModulePermissions(string $module, array $actions, ?string $moduleLabel = null, ?string $description = null): array
    {
        $moduleKey = Str::snake(trim($module));
        $label = $moduleLabel ? trim($moduleLabel) : Str::headline($moduleKey);
        $created = [];

        foreach ($actions as $action) {
            $actionKey = Str::snake(trim($action));
            $slug = "{$moduleKey}.{$actionKey}";
            $actLabel = Str::headline($actionKey);

            $name = "{$actLabel} {$label}";
            $desc = $description ? "{$description} - {$name}" : "Can {$actionKey} {$label}";

            $existing = $this->permissionRepository->findBySlug($slug);
            if ($existing) {
                $created[] = $existing;
                continue;
            }

            $permission = $this->permissionRepository->create([
                'module'      => $moduleKey,
                'action'      => $actionKey,
                'slug'        => $slug,
                'name'        => $name,
                'description' => $desc,
            ]);

            $created[] = $permission;
        }

        return $created;
    }

    /**
     * Delete a permission by ID.
     */
    public function deletePermission(int|string $id): bool
    {
        return $this->permissionRepository->delete($id);
    }

    /**
     * Resolve mixed permission identifiers (slug strings or integer IDs) to unique database IDs.
     *
     * @param array<int|string> $permissions
     * @return array<int>
     */
    public function resolvePermissionIds(array $permissions): array
    {
        $ids = [];
        $slugs = [];

        foreach ($permissions as $item) {
            if (is_numeric($item)) {
                $ids[] = (int) $item;
            } elseif (is_string($item) && trim($item) !== '') {
                $slugs[] = trim($item);
            }
        }

        if (!empty($slugs)) {
            $resolved = $this->permissionRepository->resolveIdsBySlugs($slugs);
            $ids = array_merge($ids, $resolved);
        }

        return array_values(array_unique($ids));
    }
}
