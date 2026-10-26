<?php

return [
    'path' => 'modules',

    'routes' => [
        'crawler' => 'Crawler',
        'tiktok-account' => 'TiktokAccount',
        'auth' => 'Auth',
        'user' => 'User',
        'system' => 'System',
        'role' => 'Role',
        'permission' => 'Permission',
    ],

    'modules' => ['core', 'auth', 'system', 'role', 'permission', 'user', 'tiktok_account', 'crawler'],
    'permission_action' => ['view', 'create', 'edit', 'delete'],
    'ignore_check_permission' => ['core', 'auth'],
    'ignore_group' => ['auth', 'role', 'permission'],
];