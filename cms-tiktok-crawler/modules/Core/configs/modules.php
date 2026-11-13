<?php

return [
    'path' => 'modules',

    'routes' => env('ROUTE_MAPPING', [
        'crawler' => 'Crawler',
        'tiktok-account' => 'TiktokAccount',
        'auth' => 'Auth',
        'user' => 'User',
        'system' => 'System',
        'role' => 'Role',
        'permission' => 'Permission',
        'guideline' => 'Guideline',
        'module-manager' => 'ModuleManager',
    ]),
    'permission_action' => ['view', 'create', 'edit', 'delete'],
    'modules' => ['core', 'auth', 'system', 'role', 'permission', 'user', 'tiktok_account', 'crawler', 'guideline', 'module_manager'],
    'protected' => ['core', 'auth', 'system', 'module_manager'],
    'ignore_check_permission' => ['auth', 'guideline'],
    'ignore_group' => ['auth', 'guideline'],
];
