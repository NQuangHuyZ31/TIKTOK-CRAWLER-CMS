<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Module Auth API Routes
|--------------------------------------------------------------------------
|
| - POST /{admin_path}/api/auth/login           (AuthController::login)
| - POST /{admin_path}/api/auth/logout          (AuthController::logout)
| - GET  /{admin_path}/api/auth/me              (AuthController::me - returns profile, roles, permissions matrix)
| - GET  /{admin_path}/api/auth/login-logs       (AuthController::loginLogs - paginated login attempt history)
|
| Password Management:
| - POST /{admin_path}/api/auth/reset-password  (AuthController::resetPassword)
*/
