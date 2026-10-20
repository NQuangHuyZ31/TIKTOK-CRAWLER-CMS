<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Modules\Core\Support\DynamicRouteResovle;

/*
|--------------------------------------------------------------------------
| Core Dynamic Module API Routing Engine
|--------------------------------------------------------------------------
|
| Handles all module routing dynamically without requiring explicit route
| registrations outside modules. Supports:
| - Pattern 1: /{module}/{controller}/{id}/{action}/{parameters?}
| - Pattern 2: /{module}/{controller}/{action}/{parameters?}
| - Pattern 3: /{module}/{controller}/{id}  (RESTful Show/Update/Delete)
| - Pattern 4: /{module}/{controller}       (RESTful Index/Store)
*/

DynamicRouteResovle::routes();