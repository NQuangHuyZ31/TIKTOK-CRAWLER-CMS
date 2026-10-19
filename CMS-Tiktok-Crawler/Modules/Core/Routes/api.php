<?php

use Illuminate\Support\Facades\Route;
use Modules\Core\Controllers\DynamicModuleController;

Route::match(
    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    '/{module}/{controller}/{action}/{parameters?}',
    [DynamicModuleController::class, 'dispatch']
)->where([
    'module' => '[a-z0-9-]+',
    'controller' => '[a-z0-9-]+',
    'action' => '[a-z0-9-]+',
    'parameters' => '.*',
]);
