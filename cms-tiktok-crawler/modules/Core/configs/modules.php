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
    ]),
    'permission_action' => ['view', 'create', 'edit', 'delete'],
    'modules' => ['core', 'auth', 'system', 'role', 'permission', 'user', 'tiktok_account', 'crawler'],
    'ignore_check_permission' => ['auth'],
    'ignore_group' => ['auth'],
];