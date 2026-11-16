<?php

$isDev = filter_var(env('ENABLE_DEV', false), FILTER_VALIDATE_BOOLEAN);
$devModules = ['module_manager'];

$baseModules = ['core', 'auth', 'system', 'role', 'permission', 'user', 'tiktok_account', 'crawler', 'guideline'];
$allModules = array_merge($baseModules, $devModules);

$permissionActions = [
    ['value' => 'view', 'label' => 'View (view)', 'desc' => 'Read-only access and data listing', 'basic' => true],
    ['value' => 'create', 'label' => 'Create (create)', 'desc' => 'Add new records and entities', 'basic' => true],
    ['value' => 'edit', 'label' => 'Edit (edit)', 'desc' => 'Modify existing records', 'basic' => true],
    ['value' => 'delete', 'label' => 'Delete (delete)', 'desc' => 'Permanently remove records', 'basic' => true],
    ['value' => 'export', 'label' => 'Export (export)', 'desc' => 'Export data to CSV/Excel'],
    ['value' => 'import', 'label' => 'Import (import)', 'desc' => 'Batch import data'],
    ['value' => 'approve', 'label' => 'Approve (approve)', 'desc' => 'Approve workflows'],
    ['value' => 'assign', 'label' => 'Assign (assign)', 'desc' => 'Assign roles or ownership'],
    ['value' => 'manage', 'label' => 'Manage (manage)', 'desc' => 'Administrative actions'],
];

return [
    'path' => 'modules',

    // Dev mode
    'enable_dev' => $isDev,
    'dev_modules' => $devModules,
    'disabled' => [],

    // Route match modules
    'routes' => env('ROUTE_MAPPING', array_filter([
        'core' => 'Core',
        'crawler' => 'Crawler',
        'tiktok_account' => 'TiktokAccount',
        'auth' => 'Auth',
        'user' => 'User',
        'system' => 'System',
        'role' => 'Role',
        'permission' => 'Permission',
        'guideline' => 'Guideline',
        'module_manager' => 'ModuleManager',
    ])),

    // Permission actions (Single Source of Truth)
    'permission_actions' => $permissionActions,

    // Modules config
    'modules' => $allModules,
    'protected' => ['core', 'auth', 'system', 'guideline', 'module_manager'],
    'ignore_check_permission' => ['auth', 'guideline'],
    'ignore_group' => ['auth', 'guideline'],

    // System module metadata (label, icon, color for UI registries and PermissionMatrix)
    'module_metadata' => [
        'core' => ['label' => 'Core / Dashboard', 'icon' => 'AppstoreOutlined', 'color' => 'blue'],
        'crawler' => ['label' => 'Crawler Engine', 'icon' => 'RobotOutlined', 'color' => 'purple'],
        'tiktok_account' => ['label' => 'TikTok Accounts', 'icon' => 'VideoCameraOutlined', 'color' => 'green'],
        'system' => ['label' => 'System Settings', 'icon' => 'SettingOutlined', 'color' => 'gold'],
        'user' => ['label' => 'User Management', 'icon' => 'UserOutlined', 'color' => 'cyan'],
        'role' => ['label' => 'Role Management', 'icon' => 'SafetyCertificateOutlined', 'color' => 'geekblue'],
        'permission' => ['label' => 'Permission Management', 'icon' => 'KeyOutlined', 'color' => 'magenta'],
        'auth' => ['label' => 'Authentication', 'icon' => 'LockOutlined', 'color' => 'orange'],
        'guideline' => ['label' => 'Guidelines & Docs', 'icon' => 'BookOutlined', 'color' => 'cyan'],
        'module_manager' => ['label' => 'Module Manager', 'icon' => 'AppstoreAddOutlined', 'color' => 'volcano'],
    ],

    // Only dev action allow
    'dev_only_actions' => [
        'module_manager' => ['create'],
    ],
];
