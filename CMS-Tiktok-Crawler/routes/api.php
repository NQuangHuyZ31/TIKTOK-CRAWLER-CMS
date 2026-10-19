<?php

use Illuminate\Support\Facades\Route;

// 1. Explicit module routes
if (file_exists(base_path('Modules/API/routes/api.php'))) {
    Route::group([], base_path('Modules/API/routes/api.php'));
}
if (file_exists(base_path('Modules/Crawler/routes/api.php'))) {
    Route::group([], base_path('Modules/Crawler/routes/api.php'));
}
if (file_exists(base_path('Modules/TiktokAccount/routes/api.php'))) {
    Route::group([], base_path('Modules/TiktokAccount/routes/api.php'));
}

// 2. Dynamic module route dispatcher (Core)
if (file_exists(base_path('Modules/Core/routes/api.php'))) {
    Route::group([], base_path('Modules/Core/routes/api.php'));
}
