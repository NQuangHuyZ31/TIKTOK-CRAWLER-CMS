<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Module Auth API Routes
|--------------------------------------------------------------------------
|
| Handled dynamically by Core DynamicRouteResolver:
| Pattern 1: /{admin_path}/api/auth/{action}      (Dispatched to AuthController@{action})
| Pattern 2: /{admin_path}/api/auth/auth/{action} (Dispatched to AuthController@{action})
| Pattern 3: /{admin_path}/api/core/auth/{action} (Dispatched to Core AuthController@{action})
|
| - POST /{admin_path}/api/auth/login           (AuthController::login)
| - POST /{admin_path}/api/auth/logout          (AuthController::logout)
| - GET  /{admin_path}/api/auth/me              (AuthController::me - returns profile, roles, permissions matrix)
| - GET  /{admin_path}/api/auth/login-logs       (AuthController::loginLogs - paginated login attempt history)
|
| Password Management:
| - POST /{admin_path}/api/auth/forgot-password (AuthController::forgotPassword)
| - POST /{admin_path}/api/auth/reset-password  (AuthController::resetPassword)
| - POST /{admin_path}/api/auth/change-password (AuthController::changePassword)
| - PUT  /{admin_path}/api/auth/profile         (AuthController::updateProfile)
|
| Explicit route declarations are not required because DynamicRouteResolver
| automatically discovers and dispatches all routes under the Auth module.
|
*/
