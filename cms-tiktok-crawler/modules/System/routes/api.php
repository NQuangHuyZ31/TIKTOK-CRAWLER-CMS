<?php

/*
|--------------------------------------------------------------------------
| System Module API Routes
|--------------------------------------------------------------------------
|
| Handled dynamically by Core DynamicRouteResolver:
|
| Login Logs:
| - GET    /{admin_path}/api/system/login-log              (LoginLogController::index)
| - GET    /{admin_path}/api/system/login-log/{id}         (LoginLogController::show)
|
| Activity Logs:
| - GET    /{admin_path}/api/system/activity-log           (ActivityLogController::index)
| - GET    /{admin_path}/api/system/activity-log/{id}      (ActivityLogController::show)
| - GET    /{admin_path}/api/system/activity-log/statistics (ActivityLogController::statistics)
|
| System Diagnostic:
| - GET    /{admin_path}/api/system/system-diagnostic      (SystemDiagnosticController::index)
|
| System Settings & Worker Maintenance:
| - GET    /{admin_path}/api/system/system-setting                 (SystemSettingController::index)
| - POST   /{admin_path}/api/system/system-setting/update-settings (SystemSettingController::updateSettings)
| - POST   /{admin_path}/api/system/system-setting/run-cleanup     (SystemSettingController::runCleanup)
| - GET    /{admin_path}/api/system/system-setting/history         (SystemSettingController::history)
|
*/
