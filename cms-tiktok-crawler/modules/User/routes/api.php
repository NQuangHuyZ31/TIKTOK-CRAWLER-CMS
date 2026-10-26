<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Module User API Routes
|--------------------------------------------------------------------------
| Auto-loaded dynamically through Core DynamicRouteResolver under /{admin_path}/api/
| Controllers located inside Modules\User\Controllers:
|
| 1. User Management (UserController):
|    - GET    /{admin_path}/api/user
|    - POST   /{admin_path}/api/user
|    - GET    /{admin_path}/api/user/{id}
|    - PUT    /{admin_path}/api/user/{id}
|    - DELETE /{admin_path}/api/user/{id}
|    - PATCH  /{admin_path}/api/user/{id}/status
|    - GET    /{admin_path}/api/user/statistics-summary
|    - GET    /{admin_path}/api/user/roles-and-permissions
|    - Also supports legacy /{admin_path}/api/user/user/*
|
| 2. Role Management (RoleController):
|    - GET    /{admin_path}/api/user/role
|    - POST   /{admin_path}/api/user/role
|    - GET    /{admin_path}/api/user/role/{id}
|    - PUT    /{admin_path}/api/user/role/{id}
|    - DELETE /{admin_path}/api/user/role/{id}
|    - GET    /{admin_path}/api/user/role/permissions
|
| 3. Permission Catalog (PermissionController):
|    - GET    /{admin_path}/api/user/permission
|    - GET    /{admin_path}/api/user/permission/modules
|
*/
