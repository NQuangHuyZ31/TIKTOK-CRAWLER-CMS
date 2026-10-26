<?php

namespace Modules\Role\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Permission\Models\Permission;
use Modules\Role\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the role seeds.
     */
    public function run(): void
    {
        // 1. Default Roles
        $adminRole = Role::updateOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Super Administrator',
                'description' => 'Full access to all system modules, configurations, and administrative tools.',
            ]
        );

        $managerRole = Role::updateOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Crawler Manager',
                'description' => 'Can manage crawl jobs, TikTok accounts, and view dashboard analytics.',
            ]
        );

        $editorRole = Role::updateOrCreate(
            ['slug' => 'editor'],
            [
                'name' => 'Crawler Editor',
                'description' => 'Can view and edit crawler results, jobs, and tiktok accounts.',
            ]
        );

        $viewerRole = Role::updateOrCreate(
            ['slug' => 'viewer'],
            [
                'name' => 'Data Viewer',
                'description' => 'Read-only access to crawler results, TikTok accounts, and reports.',
            ]
        );

        // 2. Assign Permissions to Roles
        // Admin gets all permissions
        $allPermissionIds = Permission::pluck('id')->all();
        $adminRole->permissions()->sync($allPermissionIds);

        // Manager gets crawl, account, and view permissions
        $managerPermissions = Permission::whereIn('slug', [
            'core.view',
            'crawler.view',
            'crawler.edit',
            'tiktok_account.view',
            'tiktok_account.edit',
            'user.view',
            'role.view',
        ])->pluck('id')->all();
        $managerRole->permissions()->sync($managerPermissions);

        // Editor gets crawler and tiktok_account view & edit permissions
        $editorPermissions = Permission::whereIn('slug', [
            'core.view',
            'crawler.view',
            'crawler.edit',
            'tiktok_account.view',
            'tiktok_account.edit',
        ])->pluck('id')->all();
        $editorRole->permissions()->sync($editorPermissions);

        // Viewer gets view-only permissions (excluding administrative user/role/permission modules)
        $viewerPermissions = Permission::where('action', 'view')
            ->whereNotIn('module', ['user', 'role', 'permission'])
            ->pluck('id')
            ->all();
        $viewerRole->permissions()->sync($viewerPermissions);
    }
}
