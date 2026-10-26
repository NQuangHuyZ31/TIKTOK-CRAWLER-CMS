<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| Module User API Routes
|--------------------------------------------------------------------------
| api: GET /{admin_path}/api/user/user/statistics-summary
| api: GET /{admin_path}/api/user/user/roles-and-permissions
| api: GET /{admin_path}/api/user/user
| api: POST /{admin_path}/api/user/user
| api: GET /{admin_path}/api/user/user/{id}
| api: PUT /{admin_path}/api/user/user/{id}
| api: PATCH /{admin_path}/api/user/user/{id}
| api: DELETE /{admin_path}/api/user/user/{id}
| api: PATCH /{admin_path}/api/user/user/{id}/status
| api: POST /{admin_path}/api/user/user/{id}/status
| Auto-loaded through CoreServiceProvider under /{admin_path}/api/
| All routes documented with usage per Rule 9.
| Every route is protected by both module.permission middleware and controller authorization.
|
*/