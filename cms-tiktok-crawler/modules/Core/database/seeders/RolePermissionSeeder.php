<?php

namespace Modules\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Core\Models\Permission;
use Modules\Core\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Define modular permissions partitioned by View / Edit
        $permissions = [
            // Crawler module
            [
                'name' => 'View Crawler Data',
                'slug' => 'crawler.view',
                'module' => 'crawler',
                'action' => 'view',
                'description' => 'Allows viewing crawl jobs, job details, statistics, and crawl results.',
            ],
            [
                'name' => 'Edit & Run Crawler',
                'slug' => 'crawler.edit',
                'module' => 'crawler',
                'action' => 'edit',
                'description' => 'Allows creating, editing, starting, and deleting crawl jobs.',
            ],

            // TikTok Account module
            [
                'name' => 'View TikTok Accounts',
                'slug' => 'tiktok_account.view',
                'module' => 'tiktok_account',
                'action' => 'view',
                'description' => 'Allows viewing TikTok account profiles, stats, and crawl history.',
            ],
            [
                'name' => 'Edit TikTok Accounts',
                'slug' => 'tiktok_account.edit',
                'module' => 'tiktok_account',
                'action' => 'edit',
                'description' => 'Allows adding, updating, uploading avatars, and deleting TikTok accounts.',
            ],

            // Core system module
            [
                'name' => 'View Core System',
                'slug' => 'core.view',
                'module' => 'core',
                'action' => 'view',
                'description' => 'Allows viewing dashboard KPIs, system health status, and reports.',
            ],
            [
                'name' => 'Edit Core System',
                'slug' => 'core.edit',
                'module' => 'core',
                'action' => 'edit',
                'description' => 'Allows managing file uploads, deleting uploaded files, and system settings.',
            ],

            // User & RBAC module
            [
                'name' => 'View Users & Roles',
                'slug' => 'user.view',
                'module' => 'user',
                'action' => 'view',
                'description' => 'Allows viewing CMS user accounts, roles, and assigned permissions.',
            ],
            [
                'name' => 'Edit Users & Roles',
                'slug' => 'user.edit',
                'module' => 'user',
                'action' => 'edit',
                'description' => 'Allows managing users, assigning roles, and configuring permissions.',
            ],
        ];

        foreach ($permissions as $permData) {
            Permission::updateOrCreate(
                ['slug' => $permData['slug']],
                $permData
            );
        }

        // 2. Define Roles
        $adminRole = Role::updateOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Super Administrator',
                'description' => 'Full administrative access across all system modules with view and edit permissions.',
            ]
        );

        $managerRole = Role::updateOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Operations Manager',
                'description' => 'Management access to crawler and TikTok accounts (view and edit), plus view access to user accounts.',
            ]
        );

        $editorRole = Role::updateOrCreate(
            ['slug' => 'editor'],
            [
                'name' => 'Crawler Specialist',
                'description' => 'Operational access to run and manage TikTok crawlers and account data.',
            ]
        );

        $viewerRole = Role::updateOrCreate(
            ['slug' => 'viewer'],
            [
                'name' => 'Data Viewer / Auditor',
                'description' => 'Read-only access to view TikTok accounts, crawl jobs, and reports.',
            ]
        );

        // 3. Assign permissions to roles
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id')->toArray());

        $managerRole->syncPermissions([
            'crawler.view',
            'crawler.edit',
            'tiktok_account.view',
            'tiktok_account.edit',
            'core.view',
            'core.edit',
            'user.view',
        ]);

        $editorRole->syncPermissions([
            'crawler.view',
            'crawler.edit',
            'tiktok_account.view',
            'tiktok_account.edit',
            'core.view',
        ]);

        $viewerRole->syncPermissions([
            'crawler.view',
            'tiktok_account.view',
            'core.view',
        ]);
    }
}
